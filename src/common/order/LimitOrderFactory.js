import {OrderFactory} from "./OrderFactory";
import {BigNumber} from "@0x/utils";
import moment from "moment";
import {OrderState} from "./OrderStateManager";
import {submitOrder} from "../0x/0x_orders_proxy";
import {Erc20ProxyAddress} from "../tokens/token_fetch";
import {formatNumber} from "../helpers";

export class LimitOrderFactory extends OrderFactory {

    constructor(order, stateManager, accountAddress) {
        super(
            order,
            stateManager,
            Erc20ProxyAddress,
            accountAddress
        );
        this.expiryTime = moment().add(1, 'years').format("yyyy-MM-DDTHH:mm")
        this.recipientAddress = null
        this.order.sellPrice.calculated = true
    }

    async clearValues() {
        await super.clearValues();
        this.expiryTime = moment().add(1, 'years').format("yyyy-MM-DDTHH:mm")
        this.recipientAddress = null
    }

    setExpiryTime(dateString, format) {
        this.expiryTime = moment(dateString).format(format)
    }

    setRecipientAddress(address) {
        this.recipientAddress = address
    }

    async sendOrder() {
        await this.stateManager.setInProgressState(OrderState.MATCHING_ORDER, {}, true)
        let order = this.buildOrderDetails(this.order.sellAmount.value, this.order.buyAmount.value)

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
        await submitOrder(order)

    }

    buildOrderDetails(sellAmount, buyAmount) {
        let orderDetails = this.order.buildOrderDetails(sellAmount, buyAmount)
        let order = {
            makerAssetAddress: this.order.sellToken.address,
            makerAssetAmount: new BigNumber(orderDetails.sellAmount),
            makerFeeAmount: new BigNumber(orderDetails.sellFeeAmount),
            takerAssetAddress: this.order.buyToken.address,
            takerAssetAmount: new BigNumber(orderDetails.buyAmount),
            takerFeeAmount: new BigNumber(orderDetails.buyFeeAmount),
            feeRecipientAddress: orderDetails.feeRecipient,
            expirationTimeSeconds: `${moment(this.expiryTime).unix()}`,
        }

        if (this.recipientAddress !== null) {
            order.takerAddress = this.recipientAddress
        }

        return order
    }
}