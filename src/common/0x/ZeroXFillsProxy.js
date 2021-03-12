import {ObservableValue} from "../order/ObservableValue";
import moment from "moment/moment";
import {fetchJson} from "../json_api_fetch";
import {METRIC_TOKEN_ADDRESS} from "../tokens/token_fetch";
import {CoinGeckoProxy} from "../tokens/CoinGeckoProxy";

export class ZeroXFillsProxy {
    constructor() {
        this.period = 7
        this.app = '811412ed-0d07-48ba-984b-b72f6a1f27d6'
        this.startDate = new ObservableValue(moment().subtract(this.period, 'days'))
        this.endDate = new ObservableValue(moment().add(1, 'days'))
        this.fills = new ObservableValue([])

        this.startDate.observe(this, 'refreshFills')
        this.endDate.observe(this, 'refreshFills')

        this.priceProxy = new CoinGeckoProxy()
    }

    traderWithLargestTrade() {
        let trades = this.fills.value.sort((a, b) => b.usdTotalValue - a.usdTotalValue)
        if (trades.length > 0) {
            return {
                address: trades[0].address,
                usdVolume: trades[0].usdTotalValue
            }
        }
        return undefined
    }

    traderWithMostTrades() {
        let traders = []
        for (let index = 0; index < this.fills.value.length; index++) {
            let fill = this.fills.value[index]
            let trader = traders.find(t => t.address === fill.address)
            if (trader) {
                trader.tradesCount += 1
            } else {
                traders.push(
                    {
                        address: fill.address,
                        tradesCount: 1
                    }
                )
            }
        }

        if (traders.length > 0) {
            return traders.sort((a, b) => b.tradesCount - a.tradesCount)[0]
        }
        return undefined
    }

    traderWithLargestMetricTrade() {
        let traders = []
        for (let index = 0; index < this.fills.value.length; index++) {
            let fill = this.fills.value[index]
            let trader = traders.find(t => t.address === fill.address)
            if (trader) {
                trader.usdVolume = Math.max(trader.usdVolume, fill.usdMetricValue)
            } else {
                traders.push(
                    {
                        address: fill.address,
                        usdVolume: fill.usdMetricValue
                    }
                )
            }
        }

        if (traders.length > 0) {
            return traders.sort((a, b) => b.usdVolume - a.usdVolume)[0]
        }
        return undefined
    }

    topDailyTradersByMetricVolume() {
        let topDailyTraders = []
        for (let index = 0; index < this.fills.value.length; index++) {
            let fill = this.fills.value[index]
            let date = topDailyTraders.find(t => t.date === fill.date)
            if (date) {
                let trader = date.traders.find(t => t.address === fill.address)
                if (trader) {
                    trader.usdVolume += fill.usdMetricValue
                } else {
                    date.traders.push(
                        {
                            address: fill.address,
                            usdVolume: fill.usdMetricValue
                        }
                    )
                }
            } else {
                topDailyTraders.push({
                    date: fill.date,
                    traders: [
                        {
                            address: fill.address,
                            usdVolume: fill.usdMetricValue
                        }
                    ]
                })
            }
        }

        return topDailyTraders
            .map(t => {
                let topTrader = t.traders.sort((a, b) => b.usdVolume - a.usdVolume)[0]
                return {
                    date: t.date,
                    address: topTrader.address,
                    usdVolume: topTrader.usdVolume
                }
            })
            .filter(t => t.usdVolume > 0)
            .sort((a, b) => b.date===a.date ? 0 : (moment(b.date).isBefore(moment(a.date)) ? -1 : 1))
    }

    tradersVolume() {
        let traders = []
        for (let index = 0; index < this.fills.value.length; index++) {
            let fill = this.fills.value[index]
            let trader = traders.find(t => t.address === fill.address)
            if (trader) {
                trader.usdVolume += fill.usdTotalValue
            } else {
                traders.push(
                    {
                        address: fill.address,
                        usdVolume: fill.usdTotalValue
                    }
                )
            }
        }

        return traders.sort((a, b) => b.usdVolume - a.usdVolume)
    }

    async refreshFills(source) {
        if (this.priceProxy.coins.length === 0) {
            await this.priceProxy.init()
        }
        await this.fetchFills(source)
    }

    async fetchFills(source, page = 1) {
        try {
            let fills =
                await fetchJson(`http://209.250.240.179:3001/fills?page=${page}&dateFrom=${this.startDate.value.format('YYYY-MM-DD')}`)

            if (fills.fills.length > 0) {
                await this.updateFills(source, fills.fills)
                if (page < fills.pageCount) {
                    await this.fetchFills(source, page + 1)
                }
            }

        } catch (e) {
            console.error('Failed to fetch order fills', e)
        }
    }

    async updateFills(source, fills) {
        let storedFills = [...this.fills.value]

        for (let index = 0; index < fills.length; index++) {
            let fill = this.extractFillData(fills[index])

            if (fill.usdValue === undefined) {
                let usdPrice = await this.priceProxy.fetchCoinPriceAt(fill.makerTokenSymbol , moment(fill.date))
                if (usdPrice === undefined) {
                    usdPrice = await this.priceProxy.fetchCoinPriceAt(fill.takerTokenSymbol , moment(fill.date))
                    fill.usdValue = usdPrice * fill.takerTokenAmount
                } else {
                    fill.usdValue = usdPrice * fill.makerTokenAmount
                }
            }

            storedFills.push({
                id: fill.id,
                address: fill.address,
                date: fill.date,
                details: {
                    makerTokenSymbol: fill.makerTokenSymbol,
                    makerAmount: fill.makerTokenAmount,
                    takerTokenSymbol: fill.takerTokenSymbol,
                    takerAmount: fill.takerTokenAmount
                },
                usdTotalValue: fill.usdValue,
                usdMetricValue: fill.isMetricTrade ? fill.usdValue: 0
            })

            await this.fills.set(
                source,
                storedFills
            )
        }
    }

    extractFillData(fill) {
        let metric = fill.apps.find(r => r.id === this.app)
        if (metric.type === "relayer") {
            return {
                id: fill.id,
                date: fill.date.substring(0, 10),
                address: fill.makerAddress,
                usdValue: fill.value.USD,
                isMetricTrade: fill.assets.find(a => { return a.tokenAddress.toUpperCase() === METRIC_TOKEN_ADDRESS.toUpperCase() }) !== undefined,
                makerTokenSymbol: fill.assets.find(a => a.traderType === "maker").tokenSymbol,
                makerTokenAmount: parseFloat(fill.assets.find(a => a.traderType === "maker").amount),
                takerTokenSymbol: fill.assets.find(a => a.traderType === "taker").tokenSymbol,
                takerTokenAmount: parseFloat(fill.assets.find(a => a.traderType === "taker").amount),
                isSwap: false
            }
        }

        if (metric.type === "consumer") {
            return {
                id: fill.id,
                date: fill.date.substring(0, 10),
                address: this.extractTakerAddress(fill),
                usdValue: fill.value.USD,
                isMetricTrade: fill.assets.find(a => { return a.tokenAddress.toUpperCase() === METRIC_TOKEN_ADDRESS.toUpperCase() }) !== undefined,
                makerTokenSymbol: fill.assets.find(a => a.traderType === "maker").tokenSymbol,
                makerTokenAmount: parseFloat(fill.assets.find(a => a.traderType === "maker").amount),
                takerTokenSymbol: fill.assets.find(a => a.traderType === "taker").tokenSymbol,
                takerTokenAmount: parseFloat(fill.assets.find(a => a.traderType === "taker").amount),
                isSwap: true
            }
        }
    }

    extractTakerAddress(fill) {
        if (fill.taker.isContract) {
            return fill.transactionFrom.address
        } else {
            return fill.taker.address
        }
    }

}