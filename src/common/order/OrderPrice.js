import {calculateMetricFee} from "../MetricFee";
import {ObservableValue} from "./ObservableValue";
import {getSwapPrice, getSwapPriceForBuy} from "../0x/swap/ZeroXSwapProxy";
import {ObservationRegister} from "./ObservationRegister";
import {OrderEventActions, OrderEventProperties, OrderEventSource} from "./OrderEventSource";
import {BigNumber} from "@0x/utils";
import {isUnwrapping, isWrapping} from "../ChainHelpers";
import {Order} from "./Order";

export class OrderPrice {

    constructor(baseToken, quoteToken, price) {
        this.price = new ObservableValue(price)
        this.baseToken = baseToken
        this.quoteToken = quoteToken
        this.inverted = false
        this.calculated = false
        this.disableFee = false

        this.gasCost = new BigNumber(0)
        this.routes = []
        this.priceImpact = 0

        this.priceInversionObservers = new ObservationRegister()
    }

    async priceDiffToMarket(sellAmount) {
        let marketPrice = await getSwapPrice(this.baseToken, this.quoteToken, sellAmount)

        if (this.price.value.isGreaterThan(0)) {
            return marketPrice
                    .price
                    .minus(this.price.value)
                    .multipliedBy(100)
                    .dividedBy(marketPrice.price)
        } else {
            return new BigNumber(NaN)
        }
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
        if (this.price.value.isGreaterThan(0)) {
            await this.price.set(
                new OrderEventSource(OrderEventProperties.Price, OrderEventActions.TokenChange),
                new BigNumber(1).dividedBy(this.price.value)
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

        if (this.inverted && price.isGreaterThan(0) && !this.calculated) {
            await this.price.set(event, new BigNumber(1).dividedBy(price))
        } else {
            await this.price.set(event, price)
        }
    }

    async invert() {
        let event = new OrderEventSource(OrderEventProperties.Price, OrderEventActions.Inversion)
        this.inverted = !this.inverted
        await Promise.all(this.priceInversionObservers.toNotify(event))
    }

    async refreshMarketPrice(amount = new BigNumber(1), source = null) {
        let price = await getSwapPrice(this.baseToken, this.quoteToken, amount)

        this.gasCost = price.gasCost
        this.routes = price.routes
        this.priceImpact = price.priceImpact

        await this.price.set(
            source === null ? new OrderEventSource(OrderEventProperties.Price, OrderEventActions.Refresh) : source,
            price.price
        )
    }

    async refreshMarketPriceForBuy(amount = 1, source = null) {
        let price = await getSwapPriceForBuy(this.baseToken, this.quoteToken, amount)

        this.gasCost = price.gasCost
        this.routes = price.routes
        this.priceImpact = price.priceImpact

        await this.price.set(
            source === null ? new OrderEventSource(OrderEventProperties.Price, OrderEventActions.Refresh) : source,
            price.price
        )
    }

    displayPrice() {
        if (this.inverted && this.price.value.isGreaterThan(0)) {
            return new BigNumber(1).dividedBy(this.price.value)
        } else {
            return this.price.value
        }
    }

    observePriceInversions(observer, callback) {
        this.priceInversionObservers.register(observer, callback)
    }

    stopObservePriceInversions(observer) {
        this.priceInversionObservers.unregister(observer)
    }

    async buyFeeAmountFor(amount, orderType, accountAddress) {
        return amount.multipliedBy(await this.tryMetricFee(orderType, accountAddress))
    }

    convertSellAmount(token, amount) {
        return this.convertTokenAmount(token, amount)
    }

    convertBuyAmount(token, amount) {
        return this.convertTokenAmount(token, amount)
    }

    async tryMetricFee(orderType, accountAddress) {

        if (orderType === Order.MarketOrderType &&
            this.routes.length === 1 &&
            this.routes[0].name !== "MultiHop")
        {
            return new BigNumber(0)
        }

        if (this.disableFee) {
            return new BigNumber(0)
        }

        if (isWrapping(this.baseToken, this.quoteToken)) {
            return new BigNumber(0)
        }

        if (isUnwrapping(this.baseToken, this.quoteToken)) {
            return new BigNumber(0)
        }

        return await calculateMetricFee(accountAddress)
    }

    convertTokenAmount(token, amount) {
        if (token.address === this.baseToken.address) {
            return amount.multipliedBy(this.price.value)
        }
        return amount.dividedBy(this.price.value)
    }

}
