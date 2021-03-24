import {ZeroXV4OrderBook} from "./ZeroXV4OrderBook";
import {ZeroXV3OrderBook} from "./ZeroXV3OrderBook";

export class ZeroXOrderBook {

    constructor(baseToken, quoteToken) {
        this.baseToken = baseToken
        this.quoteToken = quoteToken

        this.bids = []
        this.asks = []

        this.observers = []
        this.activeSyncroLoopId = setInterval((obj) => obj.refresh(), 10000, this)
        this.refresh()
    }

    setTokens(baseToken, quoteToken) {
        this.baseToken = baseToken
        this.quoteToken = quoteToken
        this.reset()
    }

    clear() {
        clearInterval(this.activeSyncroLoopId)
    }

    reset() {
        this.asks = []
        this.bids = []
        this.clear()
        this.refresh()
        this.activeSyncroLoopId = setInterval((obj) => obj.refresh(), 10000, this)
    }

    observe(observer) {
        this.observers.push(observer)
    }

    async refresh() {

        try {
            let orderBookUpdate =
                await ZeroXV3OrderBook.getOrdersMatching(this.baseToken, this.quoteToken, false)

            let orderBookV4Update =
                await ZeroXV4OrderBook.getOrdersMatching(this.baseToken, this.quoteToken, false)

            this.bids = orderBookUpdate.bids.concat(orderBookV4Update.bids)
            this.asks = orderBookUpdate.asks.concat(orderBookV4Update.asks)

            await Promise.all(
                this.observers.map(obj => obj.onOrderBookUpdate())
            )

        } catch (e) {
            console.warn(`Unexpected error while synchronizing the order book, will keep retrying. ${e}`)
        }
    }

}