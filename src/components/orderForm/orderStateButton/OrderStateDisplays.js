import {OrderState} from "../../../common/order/OrderStateManager";
import i18next from "i18next";

export class OrderStateDisplays {

    constructor() {
        this.messages = {}
        this.init()
    }

    messageForState(state) {
        return i18next.t(this.messages[state.code], state.params)
    }

    init() {
        this.messages[OrderState.STALE] = "submit.initializing"
        this.messages[OrderState.NO_WALLET_CONNECTION] = "wallet.connect_wallet"
        this.messages[OrderState.ETH_NOT_ALLOWED] = "submit.use_market_orders_for_eth"
        this.messages[OrderState.UNKNOWN_METRIC_BALANCE] = "submit.checking_metric_balance"
        this.messages[OrderState.ORDER_PARAMS_NOT_FILLED] = "submit.fill_order_params"
        this.messages[OrderState.SWAP_PARAMS_NOT_FILLED] = "submit.fill_swap_params"
        this.messages[OrderState.UNKNOWN_TOKEN_BALANCE] = "submit.checking_token_balance"
        this.messages[OrderState.INSUFFICIENT_TOKEN_BALANCE] = "submit.insufficient_balance"
        this.messages[OrderState.UNKNOWN_TOKEN_ALLOWANCE] = "submit.checking_approval"
        this.messages[OrderState.INSUFFICIENT_TOKEN_ALLOWANCE] = "submit.approve"
        this.messages[OrderState.VALID_ORDER] = "submit.place_order"
        this.messages[OrderState.VALID_WRAP] = "submit.wrap_eth"
        this.messages[OrderState.VALID_UNWRAP] = "submit.unwrap_eth"
        this.messages[OrderState.APPROVING_TOKEN] = "submit.approving"
        this.messages[OrderState.MATCHING_ORDER] = "submit.matching_order"
        this.messages[OrderState.FILLING_ORDER] = "submit.filling_orders"
        this.messages[OrderState.ORDER_FILLED] = "submit.order_fill_succeeded"
        this.messages[OrderState.OPENING_LIMIT_ORDER] = "submit.submitting_order"
        this.messages[OrderState.SWAPPING] = "submit.swapping"
        this.messages[OrderState.REJECTED] = "submit.rejected"
    }

}

