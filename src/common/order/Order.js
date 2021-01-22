import {OrderPrice} from "./OrderPrice";
import {MetricReferralAddress} from "../metric_fee";
import {BigNumber} from "@0x/utils";
import {ObservableValue} from "./ObservableValue";
import {ObservationRegister} from "./ObservationRegister";
import {OrderEventActions, OrderEventProperties, OrderEventSource} from "./OrderEventSource";

export class Order {

    constructor(type, inputToken, outputToken) {
        this.type = type
        this.sellToken = inputToken
        this.sellAmount = new ObservableValue(NaN)

        this.buyToken = outputToken
        this.buyAmount = new ObservableValue(NaN)

        this.sellPrice = new OrderPrice(inputToken, outputToken, NaN)

        this.sellPrice.price.observe(this, 'setBuyAmountOnPriceChange')
        this.sellPrice.price.observe(this, 'setSellAmountOnPriceChange')
        this.sellAmount.observe(this, 'setBuyAmountOnSellAmountChange')
        this.buyAmount.observe(this, 'setSellAmountOnBuyAmountChange')

        this.sellAmount.observe(this, 'setPriceOnSellAmountChange')
        this.buyAmount.observe(this, 'setPriceOnBuyAmountChange')

        this.tokensChangesObservers = new ObservationRegister()
    }

    isLimitOrder() {
        return this.type === Order.LimitOrderType
    }

    isMarketOrder() {
        return this.type === Order.MarketOrderType
    }

    observeTokenChanges(observer, callback) {
        this.tokensChangesObservers.register(observer, callback)
    }

    async setTokens(sellToken, buyToken) {
        this.sellToken = sellToken
        this.buyToken = buyToken
        this.sellPrice.baseToken = sellToken
        this.sellPrice.quoteToken = buyToken

        await Promise.all(
            [
                this.tokensChangesObservers.toNotify(new OrderEventSource(OrderEventProperties.Tokens, OrderEventActions.TokenChange)),
                this.clearValues()
            ]
        )
    }

    async switchTokens() {
        let token = this.sellToken
        this.sellToken = this.buyToken
        this.buyToken = token

        let byAmount = this.buyAmount.value + this.sellPrice.buyFeeAmountFor(this.buyAmount.value)

        await this.sellPrice.switchTokens()
        await this.sellAmount.set(
            new OrderEventSource(OrderEventProperties.SellAmount, OrderEventActions.TokenChange),
            byAmount
        )
        await this.tokensChangesObservers.toNotify(new OrderEventSource(OrderEventProperties.Tokens, OrderEventActions.TokenChange))
    }

    async setMaxSellAmount() {

        let maxAmount = this.sellToken.balance
        if (this.sellToken.symbol === "ETH") {
            maxAmount = Math.max(0, maxAmount - 0.1)
        }

        await this.sellAmount.set(
            new OrderEventSource(OrderEventProperties.SellAmount, OrderEventActions.SetToMax),
            maxAmount
        )
    }

    async setPriceOnSellAmountChange(source, sellAmount) {
        if (source.property === OrderEventProperties.SellAmount &&
            (source.action === OrderEventActions.Input || source.action === OrderEventActions.SetToMax)
        ) {
            if (this.isMarketOrder()) {
                let amount = isNaN(sellAmount) ? 1 : sellAmount
                await this.sellPrice.set(source, NaN)
                await this.sellPrice.refreshMarketPrice(amount, source)
            } else if (sellAmount > 0 && this.buyAmount.value > 0 && (this.sellPrice.calculated || isNaN(this.sellPrice.price.value))) {
                this.sellPrice.calculated = true
                await this.sellPrice.set(source, this.buyAmount.value / this.sellPrice.feeAdjustedSellAmountFor(sellAmount))
            }
        }
    }

    async setPriceOnBuyAmountChange(source, buyAmount) {
        if (source.property === OrderEventProperties.BuyAmount &&
            source.action === OrderEventActions.Input
        ) {
            if (this.isMarketOrder()) {
                let amount = isNaN(buyAmount) ? 1 : buyAmount
                await this.sellPrice.set(source, NaN)
                await this.sellPrice.refreshMarketPriceForBuy(amount, source)
            } else if (buyAmount > 0 && this.sellAmount.value > 0 && (this.sellPrice.calculated || isNaN(this.sellPrice.price.value))) {
                this.sellPrice.calculated = true
                await this.sellPrice.set(source, buyAmount / this.sellPrice.feeAdjustedSellAmountFor(this.sellAmount.value))
            }
        }
    }

    async setBuyAmountOnSellAmountChange(source, sellAmount) {
        if (
            source.property !== OrderEventProperties.BuyAmount &&
            !isNaN(this.sellPrice.price.value) &&
            !this.sellPrice.calculated &&
            source.property !== OrderEventProperties.Price
        ) {
            await this.buyAmount.set(source, this.sellPrice.convertSellAmount(this.sellToken, sellAmount).amount)
        }
    }

    async setBuyAmountOnPriceChange(source, price) {
        if (source.property !== OrderEventProperties.BuyAmount &&
            source.action !== OrderEventActions.Calculation &&
            !isNaN(price) &&
            !isNaN(this.sellAmount.value)) {
            await this.buyAmount.set(source, this.sellPrice.convertSellAmount(this.sellToken, this.sellAmount.value).amount)
        }
    }

    async setSellAmountOnPriceChange(source, price) {
        if (source.property !== OrderEventProperties.SellAmount &&
            source.action !== OrderEventActions.Calculation &&
            !isNaN(price) &&
            !isNaN(this.buyAmount.value)) {
            await this.sellAmount.set(source, this.sellPrice.convertBuyAmount(this.buyToken, this.buyAmount.value).amount)
        }
    }

    async setSellAmountOnBuyAmountChange(source, buyAmount) {
        if (
            source.property !== OrderEventProperties.SellAmount &&
            !isNaN(this.sellPrice.price.value) &&
            !this.sellPrice.calculated &&
            source.property !== OrderEventProperties.Price
        ) {
            await this.sellAmount.set(source, this.sellPrice.convertBuyAmount(this.buyToken, buyAmount).amount)
        }
    }

    async clearValues() {
        let priceEvent = new OrderEventSource(OrderEventProperties.Price, OrderEventActions.Reset)

        await Promise.all(
            [
                this.sellAmount.set(new OrderEventSource(OrderEventProperties.SellAmount, OrderEventActions.Reset), NaN),
                this.buyAmount.set(new OrderEventSource(OrderEventProperties.BuyAmount, OrderEventActions.Reset), NaN),
                this.sellPrice.price.set(priceEvent, NaN)
            ]
        )

        if (this.type === Order.MarketOrderType) {
            await this.sellPrice.refreshMarketPrice()
        }

    }

    buildOrderDetails(sellAmount, buyAmount) {
        return {
            sellAmount: this.adjustToIntegerValue(this.sellPrice.feeAdjustedSellAmountFor(sellAmount * (10 ** this.sellToken.decimals))),
            sellFeeAmount: this.adjustToIntegerValue(this.sellPrice.sellFeeAmountFor(sellAmount * (10 ** this.sellToken.decimals))),
            buyAmount: this.adjustToIntegerValue(buyAmount * (10 ** this.buyToken.decimals)),
            buyFeeAmount: this.adjustToIntegerValue(this.sellPrice.buyFeeAmountFor(buyAmount) * (10 ** this.buyToken.decimals)),
            feeRecipient: MetricReferralAddress
        }
    }

    adjustToIntegerValue(amount) {
        return new BigNumber(amount).integerValue(BigNumber.ROUND_DOWN).toNumber()
    }

    static MarketOrderType = 0
    static LimitOrderType = 1

}