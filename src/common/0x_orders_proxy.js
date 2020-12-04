import {BigNumber, providerUtils} from '@0x/utils';
import {orderFactory} from '@0x/order-utils/lib/src/order_factory';
import {accountAddress, getContractWrapper, getProvider} from './wallet/wallet_manager'
import {Erc20ContractProxy, fetchTokenAllowance} from "./erc20_contract_proxy";
import {getBidsMatching, getReplayClient, zeroXContractAddresses} from "./0x_order_book_proxy";
import {isTokenAmountOverLimit, tokensList, updateTokenAllowance} from "./token_fetch";
import {getFastGasPriceInWei} from "./gas_price_oracle";

export const ZeroXOrdersProxy = {

    is0xApprovedForToken: async function(address, amount) {
        let zeroXAllowanceTargetAddress = await zeroXContractAddresses().then(a => a.erc20Proxy)
        return await Erc20ContractProxy.isAddressApprovedForToken(zeroXAllowanceTargetAddress, address, amount)
    },

    approveZeroXAllowance: async function(tokenAddress, confirmationCallback, errorCallback) {
        let zeroXAllowanceTargetAddress = await zeroXContractAddresses().then(a => a.erc20Proxy)
        await Erc20ContractProxy.approveTokenForTargetAddress(
            tokenAddress,
            zeroXAllowanceTargetAddress,
            async (a, b) => {
                updateTokenAllowance(tokenAddress, Erc20ContractProxy.maxAllowance.toNumber())
                await confirmationCallback(a, b)
            },
            errorCallback
        )
    },

    submitOrder: submitOrder,

    cancelOrder: cancelOrder
}

export async function fetch0xAllowanceForToken(address) {
    let zeroXAllowanceTargetAddress = await zeroXContractAddresses().then(a => a.erc20Proxy)
    return await fetchTokenAllowance(accountAddress(), zeroXAllowanceTargetAddress, address)
}

async function cancelOrder(order) {
    return (await getContractWrapper())
            .exchange
            .cancelOrder(order.order)
            .awaitTransactionSuccessAsync({ from: accountAddress() })
}

async function submitOrder(order, referralAddress, feePercentage) {

    let myFilledMakerAmount = await tryMatchOrder(order)
    let myUnfilledMakerAmount = order.makerAssetAmount.minus(myFilledMakerAmount)

    if (myUnfilledMakerAmount.isGreaterThan(0)) {

        let myUnfilledTakerAmount =
            order.takerAssetAmount
                .multipliedBy(myUnfilledMakerAmount)
                .dividedToIntegerBy(order.makerAssetAmount)

        let makerToken = tokensList().find(t => t.address === order.makerAssetAddress)
        let takerToken = tokensList().find(t => t.address === order.takerAssetAddress)

        if (
                isTokenAmountOverLimit(makerToken, myUnfilledMakerAmount) &&
                isTokenAmountOverLimit(takerToken, myUnfilledTakerAmount)
            )
        {
            let contractWrapper = await getContractWrapper()

            const makerAssetData =
                await contractWrapper.devUtils.encodeERC20AssetData(order.makerAssetAddress).callAsync();

            const takerAssetData =
                await contractWrapper.devUtils.encodeERC20AssetData(order.takerAssetAddress).callAsync();

            let signedOrder = await orderFactory.createSignedOrderAsync(
                getProvider(),
                accountAddress(),
                myUnfilledMakerAmount,
                makerAssetData,
                myUnfilledTakerAmount,
                takerAssetData,
                await zeroXContractAddresses().then(a => a.exchange),
                {
                    makerFee: (myUnfilledMakerAmount * feePercentage).toString(),
                    takerFee: (myUnfilledTakerAmount * feePercentage).toString(),
                    feeRecipientAddress: referralAddress,
                }
            )

            await getReplayClient().submitOrderAsync(signedOrder)
        }
    }
}

async function tryMatchOrder(order) {

    let candidateFillOrders = await findCandidateOrders(order)

    let contractWrapper = await getContractWrapper()

    if (candidateFillOrders.length > 0) {

        let candidateFillOrdersTakerAmount = candidateFillOrders.map(o => o.takerFillAmount)
        let candidateFillOrdersSignatures = candidateFillOrders.map(o => o.order.signature)

        let gasPriceWei = await getFastGasPriceInWei()
        let protocolFeeMultiplier = await contractWrapper.exchange.protocolFeeMultiplier().callAsync()


        let fillOrderFunction =
            await contractWrapper
                .exchange
                .batchFillOrdersNoThrow(
                    candidateFillOrders.map(o => o.order),
                    candidateFillOrdersTakerAmount,
                    candidateFillOrdersSignatures
                )

        let gas = await fillOrderFunction.estimateGasAsync({from: accountAddress()})
        let callData = {
            from: accountAddress(),
            gas: gas,
            gasPrice: gasPriceWei,
            value: gasPriceWei * protocolFeeMultiplier.toNumber() * candidateFillOrders.length
        }
        let fillResults = await fillOrderFunction.callAsync(callData)
        let receipt = await fillOrderFunction.awaitTransactionSuccessAsync(callData);

        if (receipt.status === 1 && fillResults.length > 0) {
            return fillResults.map(l => l.takerAssetAmount).reduce((a,b) => BigNumber.sum(a, b))
        }
    }

    return new BigNumber(0)
}

async function findCandidateOrders(order) {
    let myPrice = order.takerAssetAmount.dividedBy(order.makerAssetAmount)
    let orders = await getBidsMatching(order.makerAssetAddress, order.takerAssetAddress)

    let myUnfilledMakerAmount = order.makerAssetAmount
    let candidateFillOrders = []

    for(let bid of orders) {

        let orderPrice = bid.order.makerAssetAmount.dividedBy(bid.order.takerAssetAmount)
        let remainingUnfilledOrderAmount = new BigNumber(parseInt(bid.metaData.remainingFillableTakerAssetAmount))

        if (orderPrice.isGreaterThanOrEqualTo(myPrice) &&
            myUnfilledMakerAmount.isGreaterThan(0) &&
            remainingUnfilledOrderAmount.isGreaterThan(0))
        {
            let possibleFillAmount = BigNumber.min(remainingUnfilledOrderAmount, myUnfilledMakerAmount);

            candidateFillOrders.push({order: bid.order, takerFillAmount: possibleFillAmount})
            myUnfilledMakerAmount = myUnfilledMakerAmount.minus(possibleFillAmount)
        }

        if (myUnfilledMakerAmount.isZero()) {
            break
        }
    }

    return candidateFillOrders
}
