import {OrderFactory} from "./OrderFactory";
import moment from "moment";
import {OrderState} from "./OrderStateManager";
import {ExchangeProxyV4Address} from "../tokens/token_fetch";
import {formatNumber} from "../helpers";
import {getHidingGameProxy} from "../0x/order/ZeroXV3UserPendingOrdersProxy";
import Rollbar from "rollbar";
import {ZeroXV4OrderProxy} from "../0x/order/ZeroXV4OrderProxy";

export class LimitOrderFactory extends OrderFactory {

    constructor(order, stateManager, accountAddress) {
        super(
            order,
            stateManager,
            ExchangeProxyV4Address,
            accountAddress
        );
        this.expiryTime = moment().add(7, 'days').format("yyyy-MM-DDTHH:mm")
        this.recipientAddress = null
        this.order.sellPrice.calculated = true
        this.zeroxProxy = new ZeroXV4OrderProxy()
    }

    async clearValues() {
        await super.clearValues();
        this.expiryTime = moment().add(7, 'days').format("yyyy-MM-DDTHH:mm")
        this.recipientAddress = null
    }

    async toggleHidingGameSupport() {
        this.order.sellPrice.disableFee = !this.order.useHidingGame.value
        await this.order.useHidingGame.set(undefined, this.order.sellPrice.disableFee)
    }

    setExpiryTime(dateString, format) {
        this.expiryTime = moment(dateString).format(format)
    }

    setRecipientAddress(address) {
        this.recipientAddress = address
    }

    async sendOrder(order) {

        let orderAmount =
            order.makerAmount
                .dividedBy(10 ** this.order.sellToken.decimals)
                .toNumber()

        await this.stateManager.setInProgressState(
            OrderState.OPENING_LIMIT_ORDER,
            {
                amount: formatNumber(orderAmount),
                token: this.order.sellToken
            },
            true)

        if (this.order.useHidingGame.value) {
            let hiddenOrder = await getHidingGameProxy().buildSignedOrder(order)
            await getHidingGameProxy().sendOrder(hiddenOrder)
            Rollbar.info("Hiding Game: limit order submitted successfully")
        } else {
            await this.zeroxProxy.sendOrder(order)
            Rollbar.info("limit order submitted successfully")
        }

    }

    buildOrderDetails(sellAmount, buyAmount) {
        let orderDetails = this.order.buildOrderDetails(sellAmount, buyAmount)
        let order = {
            makerToken: this.order.sellToken.address,
            makerAmount: orderDetails.sellAmount,
            takerToken: this.order.buyToken.address,
            takerAmount: orderDetails.buyAmount,
            takerFeeAmount: orderDetails.buyFeeAmount,
            feeRecipient: orderDetails.feeRecipient,
            expiry: `${moment(this.expiryTime).unix()}`
        }

        if (this.recipientAddress !== null) {
            order.taker = this.recipientAddress
        }

        return order
    }
}
