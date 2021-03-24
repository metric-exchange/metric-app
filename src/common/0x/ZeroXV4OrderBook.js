import {BigNumber} from "@0x/utils";
import {fetchJson} from "../JsonApiFetch";

export class ZeroXV4OrderBook {

    static async getOrdersMatching(baseToken, quoteToken, keepOtcOrders) {

        let orders =
            await fetchJson(`https://api.0x.org/sra/v4/orderbook?perPage=500&baseToken=${baseToken.address.toLowerCase()}&quoteToken=${quoteToken.address.toLowerCase()}`)

        let filteredBids = []
        let filteredAsks = []

        for(let bid of orders.bids.records) {
            if (ZeroXV4OrderBook.isValidOrder(bid, keepOtcOrders)) {
                filteredBids.push(ZeroXV4OrderBook.buildOrder(bid, quoteToken, baseToken))
            }
        }

        for(let ask of orders.asks.records) {
            if (ZeroXV4OrderBook.isValidOrder(ask, keepOtcOrders)) {
                filteredAsks.push(ZeroXV4OrderBook.buildOrder(ask, baseToken, quoteToken))
            }
        }

        return {
            bids: filteredBids,
            asks: filteredAsks
        }

    }

    static isValidOrder(order, keepOtcOrders) {
        let remainingPercentage =
            new BigNumber(order.metaData.remainingFillableTakerAmount)
                .multipliedBy(100)
                .dividedBy(order.order.takerAmount)

        return remainingPercentage.isGreaterThan(1) &&
            (keepOtcOrders || order.order.takerAddress === "0x0000000000000000000000000000000000000000")
    }

    static buildOrder(order, baseToken, quoteToken) {
        let remainingTakerAmount = new BigNumber(order.metaData.remainingFillableTakerAmount)
        return {
            makerAmount: new BigNumber(order.order.makerAmount)
                .dividedBy(10 ** baseToken.decimals)
                .multipliedBy(remainingTakerAmount)
                .dividedBy(order.order.takerAmount),
            takerAmount: remainingTakerAmount
                .dividedBy(10 ** quoteToken.decimals),
            price: new BigNumber(order.order.makerAmount)
                        .dividedBy(10 ** baseToken.decimals)
                        .dividedBy(order.order.takerAmount)
                        .multipliedBy(10 ** quoteToken.decimals)
        }
    }

}
