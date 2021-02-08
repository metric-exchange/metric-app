import {OrderFactory} from "./OrderFactory";
import {BigNumber} from "@0x/utils";
import moment from "moment";
import {OrderState} from "./OrderStateManager";
import {submitOrder} from "../0x/0x_orders_proxy";
import {Erc20ProxyAddress, ExchangeProxyV4Address} from "../tokens/token_fetch";
import {formatNumber} from "../helpers";
import {getHidingGameProxy} from "../0x/0x_user_orders";
import Rollbar from "rollbar";

export class LimitOrderFactory extends OrderFactory {

    constructor(order, stateManager, accountAddress) {
        super(
            order,
            stateManager,
            Erc20ProxyAddress,
            accountAddress
        );
        this.expiryTime = moment().add(7, 'days').format("yyyy-MM-DDTHH:mm")
        this.recipientAddress = null
        this.order.sellPrice.calculated = true
    }

    async clearValues() {
        await super.clearValues();
        this.expiryTime = moment().add(7, 'days').format("yyyy-MM-DDTHH:mm")
        this.recipientAddress = null
    }

    async toggleHidingGameSupport() {
        this.order.sellPrice.disableFee = !this.order.useHidingGame.value
        if (!this.order.useHidingGame.value) {
            this.allowanceAddress = ExchangeProxyV4Address
        } else {
            this.allowanceAddress = Erc20ProxyAddress
        }
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
            order.makerAssetAmount
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
            Rollbar.debug("Hiding Game: limit order submitted successfully")
        } else {
            await submitOrder(order)
            Rollbar.debug("limit order submitted successfully")
        }

    }

    buildOrderDetails(sellAmount, buyAmount) {
        let orderDetails = this.order.buildOrderDetails(sellAmount, buyAmount)
        let order = {
            makerAssetAddress: this.order.sellToken.address,
            makerAssetAmount: orderDetails.sellAmount,
            makerFeeAmount: orderDetails.sellFeeAmount,
            takerAssetAddress: this.order.buyToken.address,
            takerAssetAmount: orderDetails.buyAmount,
            takerFeeAmount: orderDetails.buyFeeAmount,
            feeRecipientAddress: orderDetails.feeRecipient,
            expirationTimeSeconds: `${moment(this.expiryTime).unix()}`
        }

        if (this.recipientAddress !== null) {
            order.takerAddress = this.recipientAddress
        }

        return order
    }
}
