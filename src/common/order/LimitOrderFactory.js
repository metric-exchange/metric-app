import {OrderFactory} from "./OrderFactory";
import {BigNumber} from "@0x/utils";
import moment from "moment";
import {OrderState} from "./OrderStateManager";
import {
    fillOrders,
    findCandidateOrders, submitOrder
} from "../0x/0x_orders_proxy";
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

        let candidates = await findCandidateOrders(order)

        if (candidates.length > 0) {
            await this.matchCandidateOrdersAndSubmitRemaining(order, candidates)
        } else {
            await this.submitRemainingOrderAfterFill(order, new BigNumber(0))
        }
    }

    async matchCandidateOrdersAndSubmitRemaining(order, candidates) {
        let filledAmount = await this.fillMatchingOrders(order, candidates)
        if (!isNaN(filledAmount)) {
            if (filledAmount.isLessThan(order.makerAssetAmount)) {
                await this.submitRemainingOrderAfterFill(order, filledAmount)
            } else {
                await this.clearValues()
            }
        }
    }

    async fillMatchingOrders(order, candidates) {

        let fillAmount =
            candidates
                .map(o => o.takerFillAmount)
                .reduce((a, b) => BigNumber.sum(a, b))
                .dividedBy(10 ** this.order.sellToken.decimals)
                .toNumber()

        await this.stateManager.setInProgressState(OrderState.FILLING_ORDER, {amount: formatNumber(fillAmount), token: this.order.sellToken}, true)

        let filledAmount = await fillOrders(candidates)

        await this.stateManager.setInfoState(OrderState.ORDER_FILLED, {amount: formatNumber(filledAmount.toNumber()), token: this.order.sellToken}, true)

        return filledAmount
    }

    async submitRemainingOrderAfterFill(order, filledAmount) {
        let remainingOrder = this.calculateRemainingOrderDetails(order, filledAmount)

        let orderAmount =
            remainingOrder.makerAssetAmount
                .dividedBy(10 ** this.order.sellToken.decimals)
                .toNumber()

        await this.stateManager.setInProgressState(
            OrderState.OPENING_LIMIT_ORDER,
            {
                amount: formatNumber(orderAmount),
                token: this.order.sellToken
            },
            true)
        await submitOrder(remainingOrder)
    }

    calculateRemainingOrderDetails(order, filledAmount) {

        let sellAmount = order.makerAssetAmount.minus(filledAmount.toNumber())
            .dividedBy(10 ** this.order.sellToken.decimals)
            .toNumber()

        let buyAmount = order.takerAssetAmount.multipliedBy(sellAmount)
            .dividedBy(order.makerAssetAmount)
            .multipliedBy(10 ** this.order.sellToken.decimals)
            .dividedBy(10 ** this.order.buyToken.decimals)
            .toNumber()

        return this.buildOrderDetails(sellAmount, buyAmount)
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
