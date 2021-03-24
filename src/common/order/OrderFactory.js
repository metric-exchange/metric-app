import {tokensList} from "../tokens/token_fetch";
import {OrderState} from "./OrderStateManager";
import {approveZeroXAllowance} from "../0x/ZeroXOrderManagerProxy";
import Rollbar from "rollbar";
import {UrlManager} from "../url/UrlManager";
import {chainToken, isUnwrapping, isWrapping} from "../ChainHelpers";

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
        let metric = UrlManager.metricToken()
        let metricWithBalance = tokensList().find(t => t.address.toLowerCase() === metric.address.toLowerCase())

        if (this.account === null || this.account === undefined) {
            await this.stateManager.setReadyState(OrderState.NO_WALLET_CONNECTION)
        } else if(this.order.isLimitOrder() && (this.order.sellToken.address === chainToken().address || this.order.buyToken.address === chainToken().address)) {
            await this.stateManager.setInvalidState(OrderState.ETH_NOT_ALLOWED)
        } else if (metricWithBalance && isNaN(metricWithBalance.balance)) {
            await this.stateManager.setInProgressState(OrderState.UNKNOWN_METRIC_BALANCE)
        } else if (
            this.order.sellPrice.price.value.isNaN() &&
            this.order.isLimitOrder()
        ) {
            await this.fillMissingParamsStatus()
        } else if (
            this.order.sellAmount.value.isNaN() ||
            this.order.sellAmount.value.isLessThanOrEqualTo(0) ||
            this.order.buyAmount.value.isNaN(0) ||
            this.order.buyAmount.value.isLessThanOrEqualTo(0)
        ) {
            await this.fillMissingParamsStatus()
        } else if (isNaN(this.order.sellToken.balance)) {
            await this.stateManager.setInProgressState(OrderState.UNKNOWN_TOKEN_BALANCE, {token: this.order.sellToken})
        } else if (this.order.sellToken.balance.isLessThan(this.order.sellAmount.value)) {
            await this.stateManager.setInvalidState(OrderState.INSUFFICIENT_TOKEN_BALANCE, {token: this.order.sellToken})
        } else if (this.order.isMarketOrder() && this.ethOrderValue().isGreaterThan(tokensList().find(t => t.address === chainToken().address).balance)) {
            await this.stateManager.setInvalidState(OrderState.INSUFFICIENT_TOKEN_BALANCE, {token: tokensList().find(t => t.address === chainToken().address)})
        } else if (isNaN(this.order.sellToken.allowance[this.allowanceAddress])) {
            await this.stateManager.setInProgressState(OrderState.UNKNOWN_TOKEN_ALLOWANCE, {token: this.order.sellToken})
        } else if (this.order.sellAmount.value.isGreaterThan(this.order.sellToken.allowance[this.allowanceAddress])) {
            await this.stateManager.setReadyState(OrderState.INSUFFICIENT_TOKEN_ALLOWANCE, {token: this.order.sellToken})
        } else if (isWrapping(this.order.sellToken, this.order.buyToken)) {
            await this.stateManager.setReadyState(OrderState.VALID_WRAP)
        } else if (isUnwrapping(this.order.sellToken, this.order.buyToken)) {
            await this.stateManager.setReadyState(OrderState.VALID_UNWRAP)
        } else {
            await this.stateManager.setReadyState(OrderState.VALID_ORDER)
        }
    }

    ethOrderValue() {
        if (this.order.sellToken.address === chainToken().address) {
            return this.order.sellPrice.gasCost.plus(this.order.sellAmount.value)
        } else {
            return this.order.sellPrice.gasCost
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
            let order = this.buildOrderDetails(this.order.sellAmount.value, this.order.buyAmount.value)
            if (this.stateManager.current.code === OrderState.INSUFFICIENT_TOKEN_ALLOWANCE) {
                await this.stateManager.setInProgressState(OrderState.APPROVING_TOKEN, {token: this.order.sellToken}, true)
                await approveZeroXAllowance(
                    this.order.sellToken,
                    this.allowanceAddress,
                    async () => {
                        console.debug(`${this.order.sellToken.symbol} allowance approved`)
                        try {
                            await this.sendOrder(order)
                            this.stateManager.unlock()
                            await this.clearValues()
                        } catch(e) {
                            console.warn(`order submit failed with error. ${e.message}`)
                            await this.stateManager.setInvalidState(OrderState.REJECTED, {}, true)
                            setTimeout(async (obj) => {
                                obj.stateManager.unlock()
                                await obj.refreshOrderState()
                            }, 2000, this)
                        }
                    },
                    async () => {
                        console.warn(`${this.order.sellToken.symbol} allowance approval rejected`)
                        await this.stateManager.setInvalidState(OrderState.REJECTED, {}, true)
                        setTimeout(async (obj) => {
                            obj.stateManager.unlock()
                            await obj.refreshOrderState()
                        }, 2000, this)
                    }
                )
            } else {
                await this.sendOrder(order)
                this.stateManager.unlock()
                await this.clearValues()
            }
        } catch (e) {
            console.warn(`order submit failed with error. ${e.message}`)
            await this.stateManager.setInvalidState(OrderState.REJECTED, {}, true)
            setTimeout(async (obj) => {
                obj.stateManager.unlock()
                await obj.refreshOrderState()
            }, 2000, this)
        }
    }

    async sendOrder() {

    }

    buildOrderDetails(sellAmount, buyAmount) {

    }

}
