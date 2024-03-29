import {ZeroXV4OrderBookProxy} from "./ZeroXV4OrderBookProxy";

export class ZeroXOrderBook {

    constructor(baseToken, quoteToken) {
        this.baseToken = baseToken
        this.quoteToken = quoteToken
        this.orderBookV4Proxy = new ZeroXV4OrderBookProxy()

        this.bids = []
        this.asks = []

        this.observers = []
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

            let orderBookUpdate = {
                bids: [], asks: []
            }

            let orderBookV4Update =
                await this.orderBookV4Proxy.getOrdersMatching(this.baseToken, this.quoteToken, false)

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