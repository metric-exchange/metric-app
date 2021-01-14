import {BigNumber} from '@0x/utils';
import {orderFactory} from '@0x/order-utils/lib/src/order_factory';
import {accountAddress, getContractWrapper, getProvider} from '../wallet/wallet_manager'
import {Erc20ContractProxy} from "../erc20_contract_proxy";
import {zeroXContractAddresses, ZeroXOrderBook} from "./0x_order_book_proxy";
import {updateAllowance} from "../tokens/token_fetch";
import {getFastGasPriceInWei} from "../gas_price_oracle";

export async function approveZeroXAllowance(token, target, confirmationCallback, errorCallback) {
    await Erc20ContractProxy.approveTokenForTargetAddress(
        token.address,
        target,
        async (a, b) => {
            await updateAllowance(token, Erc20ContractProxy.maxAllowance.toNumber())
            await confirmationCallback(a, b)
        },
        errorCallback
    )
}

export async function findCandidateOrders(order) {
    let myPrice = order.takerAssetAmount.dividedBy(order.makerAssetAmount)
    let orders = await ZeroXOrderBook.getBidsMatching(order.makerAssetAddress, order.takerAssetAddress)

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

export async function fillOrders(candidates) {

    let contractWrapper = await getContractWrapper()

    if (candidates.length === 0) {
        return new BigNumber(0)
    }

    let candidateFillOrdersTakerAmount = candidates.map(o => o.takerFillAmount)
    let candidateFillOrdersSignatures = candidates.map(o => o.order.signature)

    let gasPriceWei = await getFastGasPriceInWei()
    let protocolFeeMultiplier = await contractWrapper.exchange.protocolFeeMultiplier().callAsync()

    let fillOrderFunction =
        contractWrapper
            .exchange
            .batchFillOrdersNoThrow(
                candidates.map(o => o.order),
                candidateFillOrdersTakerAmount,
                candidateFillOrdersSignatures
            )

    let gas = await fillOrderFunction.estimateGasAsync({from: accountAddress()})
    let callData = {
        from: accountAddress(),
        gas: gas,
        gasPrice: gasPriceWei,
        value: gasPriceWei * protocolFeeMultiplier.toNumber() * candidates.length
    }

    let fillResults = await fillOrderFunction.callAsync(callData)
    let receipt = await fillOrderFunction.awaitTransactionSuccessAsync(callData);

    if (receipt.status === 1 && fillResults.length > 0) {
        return fillResults.map(l => l.takerAssetAmount).reduce((a,b) => BigNumber.sum(a, b))
    }

    return NaN
}

export async function submitOrder(order) {

    let contractWrapper = await getContractWrapper()

    const makerAssetData =
        await contractWrapper.devUtils.encodeERC20AssetData(order.makerAssetAddress).callAsync();

    const takerAssetData =
        await contractWrapper.devUtils.encodeERC20AssetData(order.takerAssetAddress).callAsync();

    let orderParams = {
        makerFee: order.makerFeeAmount,
        takerFee: order.takerFeeAmount,
        feeRecipientAddress: order.feeRecipientAddress,
        expirationTimeSeconds: order.expirationTimeSeconds
    }

    if (isValidAddress(order.takerAddress)) {
        orderParams.takerAddress = order.takerAddress
    }

    let signedOrder = await orderFactory.createSignedOrderAsync(
        getProvider(),
        accountAddress(),
        order.makerAssetAmount,
        makerAssetData,
        order.takerAssetAmount,
        takerAssetData,
        await zeroXContractAddresses().then(a => a.exchange),
        orderParams
    )

    return ZeroXOrderBook.relayClient.submitOrderAsync(signedOrder)
}

export async function cancelOrder(order) {
    return (await getContractWrapper())
            .exchange
            .cancelOrder(order.order)
            .awaitTransactionSuccessAsync({ from: accountAddress() })
}
export async function batchCancelOrders(orders) {
    return (await getContractWrapper())
        .exchange
        .batchCancelOrders(orders.map(o => o.order))
        .awaitTransactionSuccessAsync({ from: accountAddress() })
}

function isValidAddress(address) {
    return address !== null && address !== undefined && address.match("0x[0-9a-zA-Z]{40}") !== null
}
