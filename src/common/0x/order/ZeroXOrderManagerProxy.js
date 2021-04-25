import {accountAddress, getContractWrapper} from '../../wallet/WalletManager'
import {Erc20ContractProxy} from "../../Erc20ContractProxy";
import {updateAllowance} from "../../tokens/token_fetch";

export async function approveZeroXAllowance(token, target, confirmationCallback, errorCallback) {
    await Erc20ContractProxy.approveTokenForTargetAddress(
        token.address,
        target,
        async (a, b) => {
            await updateAllowance(token, target, Erc20ContractProxy.maxAllowance)
            await confirmationCallback(a, b)
        },
        errorCallback
    )
}

export async function cancelOrder(order) {
    let contractWrapper = await getContractWrapper()

    if (order.isHidingBook) {
        await contractWrapper
            .exchangeProxy
            .cancelRfqOrder(order.order)
            .awaitTransactionSuccessAsync({ from: accountAddress() })
    } else if (order.version === 3) {
        await contractWrapper
            .exchange
            .cancelOrder(order.order)
            .awaitTransactionSuccessAsync({ from: accountAddress() })
    } else {
        await contractWrapper
            .exchangeProxy
            .cancelLimitOrder(order.order)
            .awaitTransactionSuccessAsync({ from: accountAddress() })
    }

}

export async function batchCancelOrders(orders) {
    let contractWrapper = await getContractWrapper()
    let v3Orders = orders.filter(o => o.version === 3)
    let v4Orders = orders.filter(o => o.version === 4 && o.isHidingBook === false)
    let hidingGameOrders = orders.filter(o => o.isHidingBook === true)

    if (v3Orders.length > 0) {
        await contractWrapper
            .exchange
            .batchCancelOrders(v3Orders.map(o => o.order))
            .awaitTransactionSuccessAsync({ from: accountAddress() })
    }

    if (hidingGameOrders.length > 0) {
        await contractWrapper
            .exchangeProxy
            .batchCancelRfqOrders(v4Orders.map(o => o.order))
            .awaitTransactionSuccessAsync({ from: accountAddress() })
    }

    if (v4Orders.length > 0) {
        await contractWrapper
            .exchangeProxy
            .batchCancelLimitOrders(v4Orders.map(o => o.order))
            .awaitTransactionSuccessAsync({ from: accountAddress() })
    }
}