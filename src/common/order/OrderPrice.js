import {calculateMetricFee} from "../metric_fee";
import {ObservableValue} from "./ObservableValue";
import {getSwapPrice, getSwapPriceWithForBuy} from "../0x/0x_swap_proxy";
import {ObservationRegister} from "./ObservationRegister";
import {OrderEventActions, OrderEventProperties, OrderEventSource} from "./OrderEventSource";

export class OrderPrice {

    constructor(baseToken, quoteToken, price) {
        this.price = new ObservableValue(price)
        this.baseToken = baseToken
        this.quoteToken = quoteToken
        this.inverted = false
        this.calculated = false
        this.disableFee = false

        this.priceInversionObservers = new ObservationRegister()
    }

    priceTokens() {
        if (!this.inverted) {
            return {
                quote: this.baseToken,
                base: this.quoteToken,
            }
        } else {
            return {
                base: this.baseToken,
                quote: this.quoteToken,
            }
        }
    }

    async switchTokens() {
        if (this.inverted) {
            this.inverted = false
        }

        let token = this.baseToken
        this.baseToken = this.quoteToken
        this.quoteToken = token
        if (this.price.value > 0) {
            await this.price.set(
                new OrderEventSource(OrderEventProperties.Price, OrderEventActions.TokenChange),
                1 / this.price.value
            )
        }
    }

    async set(source, price) {
        let priceEvent = new OrderEventSource(OrderEventProperties.Price, OrderEventActions.Calculation)
        let event = source

        if (this.calculated && source.property !== OrderEventProperties.Price) {
            event = priceEvent
        } else {
            this.calculated = false
        }

        if (this.inverted && price > 0 && !this.calculated) {
            await this.price.set(event, 1/price)
        } else {
            await this.price.set(event, price)
        }
    }

    async invert() {
        let event = new OrderEventSource(OrderEventProperties.Price, OrderEventActions.Inversion)
        this.inverted = !this.inverted
        await Promise.all(this.priceInversionObservers.toNotify(event))
    }

    async refreshMarketPrice(amount = 1, source = null) {
        let price = await getSwapPrice(this.baseToken, this.quoteToken, amount)

        await this.price.set(
            source === null ? new OrderEventSource(OrderEventProperties.Price, OrderEventActions.Refresh) : source,
            price
        )
    }

    async refreshMarketPriceForBuy(amount = 1, source = null) {
        let price = await getSwapPriceWithForBuy(this.baseToken, this.quoteToken, amount)
        await this.price.set(
            source === null ? new OrderEventSource(OrderEventProperties.Price, OrderEventActions.Refresh) : source,
            price
        )
    }

    async fetchDisplayMarketPrice() {
        let price = await getSwapPrice(this.baseToken, this.quoteToken)
        if (this.inverted && price > 0) {
            return 1 / price
        } else {
            return price
        }
    }

    displayPrice() {
        if (this.inverted && this.price.value > 0) {
            return 1 / this.price.value
        } else {
            return this.price.value
        }
    }

    observePriceInversions(observer, callback) {
        this.priceInversionObservers.register(observer, callback)
    }

    feeAdjustedSellAmountFor(amount) {
        return amount * 1000 / (1000 + this.tryMetricFee() * 1000)
    }

    sellFeeAmountFor(sellAmount) {
        return this.feeAdjustedSellAmountFor(sellAmount) * this.tryMetricFee()
    }

    buyFeeAmountFor(amount) {
        return amount * this.tryMetricFee()
    }

    convertSellAmount(token, amount) {
        return this.convertTokenAmount(token, this.feeAdjustedSellAmountFor(amount))
    }

    convertBuyAmount(token, amount) {
        let feeAdjustedAmount = amount * (1000 + this.tryMetricFee() * 1000) / 1000
        return this.convertTokenAmount(token, feeAdjustedAmount)
    }

    tryMetricFee() {
        if (this.disableFee) {
            return 0
        }

        if (this.baseToken.symbol === "ETH" && this.quoteToken.symbol === "WETH") {
            return 0
        }

        if (this.baseToken.symbol === "WETH" && this.quoteToken.symbol === "ETH") {
            return 0
        }

        return calculateMetricFee()
    }

    convertTokenAmount(token, amount) {
        if (token.address === this.baseToken.address) {
            return {
                token: this.quoteToken,
                amount: amount * this.price.value
            }
        }

        return {
            token: this.baseToken,
            amount: amount / this.price.value
        }
    }

}
