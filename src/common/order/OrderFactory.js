import {METRIC_TOKEN_ADDRESS, tokensList} from "../tokens/token_fetch";
import {OrderState} from "./OrderStateManager";
import {approveZeroXAllowance} from "../0x/0x_orders_proxy";
import Rollbar from "rollbar";

export class OrderFactory {

    constructor(order, stateManager, allowanceAddress, accountAddress) {
        this.allowanceAddress = allowanceAddress
        this.stateManager = stateManager
        this.order = order
        this.account = accountAddress
    }
    async clearValues() {
        await this.order.clearValues()
        await this.refreshOrderState()
    }

    async reset() {
        this.account = null
        await this.clearValues()
    }

    async setAccount(account) {
        this.account = account
        await this.clearValues()
    }

    async refreshOrderState() {
        if (this.account === null || this.account === undefined) {
            await this.stateManager.setReadyState(OrderState.NO_WALLET_CONNECTION)
        } else if(this.order.isLimitOrder() && (this.order.sellToken.symbol === "ETH" || this.order.buyToken.symbol === "ETH")) {
            await this.stateManager.setInvalidState(OrderState.ETH_NOT_ALLOWED)
        } else if (isNaN(tokensList().find(t => t.address.toLowerCase() === METRIC_TOKEN_ADDRESS.toLowerCase()).balance)) {
            await this.stateManager.setInProgressState(OrderState.UNKNOWN_METRIC_BALANCE)
        } else if (isNaN(this.order.sellPrice.price.value) && this.order.isLimitOrder()) {
            await this.fillMissingParamsStatus()
        } else if (isNaN(this.order.sellAmount.value) || isNaN(this.order.buyAmount.value)) {
            await this.fillMissingParamsStatus()
        } else if (isNaN(this.order.sellToken.balance)) {
            await this.stateManager.setInProgressState(OrderState.UNKNOWN_TOKEN_BALANCE, {token: this.order.sellToken})
        } else if (this.order.sellToken.balance < this.order.sellAmount.value) {
            await this.stateManager.setInvalidState(OrderState.INSUFFICIENT_TOKEN_BALANCE, {token: this.order.sellToken})
        } else if (isNaN(this.order.sellToken.allowance[this.allowanceAddress])) {
            await this.stateManager.setInProgressState(OrderState.UNKNOWN_TOKEN_ALLOWANCE, {token: this.order.sellToken})
        } else if (this.order.sellToken.allowance[this.allowanceAddress] < this.order.sellAmount.value) {
            await this.stateManager.setReadyState(OrderState.INSUFFICIENT_TOKEN_ALLOWANCE, {token: this.order.sellToken})
        } else if (this.order.sellToken.symbol === "ETH" && this.order.buyToken.symbol === "WETH") {
            await this.stateManager.setReadyState(OrderState.VALID_WRAP)
        } else if (this.order.sellToken.symbol === "WETH" && this.order.buyToken.symbol === "ETH") {
            await this.stateManager.setReadyState(OrderState.VALID_UNWRAP)
        } else {
            await this.stateManager.setReadyState(OrderState.VALID_ORDER)
        }
    }

    async fillMissingParamsStatus() {
        if (this.order.isMarketOrder()) {
            await this.stateManager.setInvalidState(OrderState.SWAP_PARAMS_NOT_FILLED)
        } else {
            await this.stateManager.setInvalidState(OrderState.ORDER_PARAMS_NOT_FILLED)
        }
    }

    async submitOrder() {
        this.stateManager.lock()

        try {
            if (this.stateManager.current.code === OrderState.INSUFFICIENT_TOKEN_ALLOWANCE) {
                await this.stateManager.setInProgressState(OrderState.APPROVING_TOKEN, {token: this.order.sellToken}, true)
                await approveZeroXAllowance(
                    this.order.sellToken,
                    this.allowanceAddress,
                    async () => {
                        Rollbar.debug(`${this.order.sellToken.symbol} allowance approved`)
                        await this.sendOrder()
                    },
                    async () => {
                        Rollbar.warn(`${this.order.sellToken.symbol} allowance approval rejected`)
                        await this.stateManager.setInProgressState(OrderState.REJECTED, true)
                    }
                )
            } else {
                await this.sendOrder()
            }
            await this.order.clearValues()
        } catch (e) {
            Rollbar.warn("order submit failed with error", e)
            await this.stateManager.setInProgressState(OrderState.REJECTED, true)
        }

        setTimeout(async (obj) => {
            obj.stateManager.unlock()
            await obj.refreshOrderState()
        }, 1000, this)
    }

    async sendOrder() {

    }

}
