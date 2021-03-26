
export class OrderBookProxy {

    constructor() {}

    async getOrdersMatching(baseToken, quoteToken, keepOtcOrders) {

        let orders = await this.getOrdersAsync(baseToken, quoteToken)

        return {
            bids: this.extractValidOrders(orders.bids.records, keepOtcOrders, baseToken, quoteToken),
            asks: this.extractValidOrders(orders.asks.records, keepOtcOrders, baseToken, quoteToken)
        }

    }

    extractValidOrders(orders, keepOtcOrders, baseToken, quoteToken) {
        let validOrders = []

        for(let order of orders) {
            let orderInfo = this.extractOrderInfo(order)
            if (this.isValidOrder(orderInfo, keepOtcOrders)) {
                validOrders.push(this.buildOrder(orderInfo, baseToken, quoteToken))
            }
        }

        return validOrders
    }

    isValidOrder(order, keepOtcOrders) {
        let remainingPercentage =
            order.remainingFillableTakerAmount
                .multipliedBy(100)
                .dividedBy(order.takerAmount)

        return remainingPercentage.isGreaterThan(1) &&
            (keepOtcOrders || order.takerAddress === "0x0000000000000000000000000000000000000000")
    }

    buildOrder(order, baseToken, quoteToken) {
        return {
            makerAmount: order.makerAmount
                .dividedBy(10 ** baseToken.decimals)
                .multipliedBy(order.remainingFillableTakerAmount)
                .dividedBy(order.takerAmount),
            takerAmount: order.remainingFillableTakerAmount
                .dividedBy(10 ** quoteToken.decimals),
            price: order.makerAmount
                .dividedBy(10 ** baseToken.decimals)
                .dividedBy(order.takerAmount)
                .multipliedBy(10 ** quoteToken.decimals)
        }
    }

    async getOrdersAsync(baseToken, quoteToken) {}

    extractOrderInfo(order) {}

}