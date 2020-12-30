import {formatNumber} from "../../../common/helpers";

export function connectWalletMessage() {
    return {
        message: "wallet.connect_wallet",
        showLoader: false
    }
}

export function insufficientBalance() {
    return {
        message: "submit.insufficient_balance",
        showLoader: false
    }
}

export function checkingApprovalMessage(token) {
    return {
        message: "submit.checking_approval",
        params: {token: token},
        showLoader: true
    }
}

export function approveToken(token) {
    return {
        message: "submit.approve",
        params: {token: token},
        showLoader: false
    }
}

export function approving(token) {
    return {
        message: "submit.approving",
        params: {token: token},
        showLoader: true
    }
}

export function fillOrderAmountPriceMessage() {
    return {
        message: "submit.fill_order_params",
        showLoader: false
    }
}

export function placeOrder() {
    return {
        message: "submit.place_order",
        showLoader: false
    }
}

export function matchingOrder() {
    return {
        message: "submit.matching_order",
        showLoader: true
    }
}

export function fillingOrder(amount, token) {
    return {
        message: "submit.filling_orders",
        params: {
            amount: formatNumber(amount),
            token: token
        },
        showLoader: true
    }
}

export function orderFillExecuted(amount, token) {
    return {
        message: "submit.order_fill_succeeded",
        params: {
            amount: formatNumber(amount),
            token: token
        },
        showLoader: false
    }
}

export function submittingOrder(amount, token) {
    return {
        message: "submit.submitting_order",
        params: {
            amount: formatNumber(amount),
            token: token
        },
        showLoader: true
    }
}
