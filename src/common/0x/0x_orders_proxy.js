import {orderFactory} from '@0x/order-utils/lib/src/order_factory';
import {accountAddress, getContractWrapper, getProvider} from '../wallet/wallet_manager'
import {Erc20ContractProxy} from "../erc20_contract_proxy";
import {zeroXContractAddresses, ZeroXOrderBook} from "./0x_order_book_proxy";
import {updateAllowance} from "../tokens/token_fetch";

export async function approveZeroXAllowance(token, target, confirmationCallback, errorCallback) {
    await Erc20ContractProxy.approveTokenForTargetAddress(
        token.address,
        target,
        async (a, b) => {
            await updateAllowance(token, target, Erc20ContractProxy.maxAllowance.toNumber())
            await confirmationCallback(a, b)
        },
        errorCallback
    )
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

    await ZeroXOrderBook.relayClient.submitOrderAsync(signedOrder)
}

export async function cancelOrder(order) {
    let contractWrapper = await getContractWrapper()
    if (order.version === 3) {
        await contractWrapper
            .exchange
            .cancelOrder(order.order)
            .awaitTransactionSuccessAsync({ from: accountAddress() })
    } else {
        await contractWrapper
            .exchangeProxy
            .cancelRfqOrder(order.order)
            .awaitTransactionSuccessAsync({ from: accountAddress() })
    }

}
export async function batchCancelOrders(orders) {
    let contractWrapper = await getContractWrapper()
    let v3Orders = orders.filter(o => o.version === 3)
    let v4Orders = orders.filter(o => o.version === 4)

    if (v3Orders.length > 0) {
        await contractWrapper
            .exchange
            .batchCancelOrders(orders.map(o => o.order))
            .awaitTransactionSuccessAsync({ from: accountAddress() })
    }

    if (v4Orders.length > 0) {
        await contractWrapper
            .exchangeProxy
            .batchCancelRfqOrders(orders.map(o => o.order))
            .awaitTransactionSuccessAsync({ from: accountAddress() })
    }
}

function isValidAddress(address) {
    return address !== null && address !== undefined && address.match("0x[0-9a-zA-Z]{40}") !== null
}
