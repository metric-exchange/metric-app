import {BigNumber} from '@0x/utils';
import {orderFactory} from '@0x/order-utils/lib/src/order_factory';
import {accountAddress, getContractWrapper, getProvider} from '../wallet/wallet_manager'
import {Erc20ContractProxy, fetchTokenAllowance} from "../erc20_contract_proxy";
import {getBidsMatching, getReplayClient, zeroXContractAddresses} from "./0x_order_book_proxy";
import {updateTokenAllowance} from "../tokens/token_fetch";
import {getFastGasPriceInWei} from "../gas_price_oracle";

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

    console.debug("processing order: ", order)

    let myFilledMakerAmount = await tryMatchOrder(order)
    let myUnfilledMakerAmount = order.makerAssetAmount.minus(myFilledMakerAmount)

    console.debug("is order to submit: ", myUnfilledMakerAmount.isGreaterThan(0))

    if (myUnfilledMakerAmount.isGreaterThan(0)) {

        let myUnfilledTakerAmount =
            order.takerAssetAmount
                .multipliedBy(myUnfilledMakerAmount)
                .dividedToIntegerBy(order.makerAssetAmount)

        let contractWrapper = await getContractWrapper()

        const makerAssetData =
            await contractWrapper.devUtils.encodeERC20AssetData(order.makerAssetAddress).callAsync();

        const takerAssetData =
            await contractWrapper.devUtils.encodeERC20AssetData(order.takerAssetAddress).callAsync();

        let orderParams = {
            makerFee: `${myUnfilledMakerAmount.multipliedBy(feePercentage)}`,
            takerFee: `${myUnfilledTakerAmount.multipliedBy(feePercentage)}`,
            feeRecipientAddress: referralAddress,
            expirationTimeSeconds: `${order.expirationTimeSeconds}`
        }

        if (isValidAddress(order.takerAddress)) {
            orderParams.takerAddress = order.takerAddress
        }

        let signedOrder = await orderFactory.createSignedOrderAsync(
            getProvider(),
            accountAddress(),
            myUnfilledMakerAmount,
            makerAssetData,
            myUnfilledTakerAmount,
            takerAssetData,
            await zeroXContractAddresses().then(a => a.exchange),
            orderParams
        )

        await getReplayClient().submitOrderAsync(signedOrder)
    }
}

async function tryMatchOrder(order) {

    console.debug("fetching orders to match")

    let candidateFillOrders = await findCandidateOrders(order)

    console.debug("found candidates: ", candidateFillOrders)

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

        if ((!isValidAddress(order.takerAddress) || order.takerAddress.toLowerCase() === bid.order.takerAddress.toLowerCase()) &&
            orderPrice.isGreaterThanOrEqualTo(myPrice) &&
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

function isValidAddress(address) {
    return address !== null && address !== undefined && address.match("0x[0-9a-zA-Z]{40}") !== null
}
