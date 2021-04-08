import {ObservableValue} from "../../order/ObservableValue";
import moment from "moment/moment";
import {fetchJson} from "../../JsonApiFetch";
import {METRIC_TOKEN_ADDRESS} from "../../tokens/token_fetch";
import {CoinPriceProxy} from "../../tokens/CoinGeckoProxy";
import {tryFormatWalletName} from "../../wallet/WalletManager";

export class MetricTrackerFillsProxy {
    constructor() {
        this.period = 15
        this.app = '811412ed-0d07-48ba-984b-b72f6a1f27d6'
        this.startDate = new ObservableValue(moment().subtract(this.period, 'days'))
        this.endDate = new ObservableValue(moment().add(1, 'days'))
        this.fills = new ObservableValue([])

        this.startDate.observe(this, 'refreshFills')
        this.endDate.observe(this, 'refreshFills')

        this.synchoHandle = 0
    }

    clear() {
        clearInterval(this.synchoHandle)
    }

    traderWithLargestTrade() {
        let trades = this.eligibleFills().sort((a, b) => b.usdTotalValue - a.usdTotalValue)
        if (trades.length > 0) {
            return {
                address: trades[0].address,
                name: trades[0].name,
                usdVolume: trades[0].usdTotalValue
            }
        }
        return undefined
    }

    traderWithMostTrades() {
        let traders = []
        let fills = this.eligibleFills()
        for (let index = 0; index < fills.length; index++) {
            let fill = fills[index]
            let trader = traders.find(t => t.address === fill.address)
            if (trader) {
                trader.tradesCount += 1
            } else {
                traders.push(
                    {
                        address: fill.address,
                        name: fill.name,
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
        let fills = this.eligibleFills()
        for (let index = 0; index < fills.length; index++) {
            let fill = fills[index]
            let trader = traders.find(t => t.address === fill.address)
            if (trader) {
                trader.usdVolume = Math.max(trader.usdVolume, fill.usdMetricValue)
            } else {
                traders.push(
                    {
                        address: fill.address,
                        name: fill.name,
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

    topDailyTradersByVolume() {
        let topDailyTraders = []
        let fills = this.eligibleFills()
        for (let index = 0; index < fills.length; index++) {
            let fill = fills[index]
            let date = topDailyTraders.find(t => t.date === fill.date)
            if (date) {
                let trader = date.traders.find(t => t.address === fill.address)
                if (trader) {
                    trader.usdVolume += fill.usdTotalValue
                } else {
                    date.traders.push(
                        {
                            address: fill.address,
                            name: fill.name,
                            usdVolume: fill.usdTotalValue
                        }
                    )
                }
            } else {
                topDailyTraders.push({
                    date: fill.date,
                    traders: [
                        {
                            address: fill.address,
                            name: fill.name,
                            usdVolume: fill.usdTotalValue
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
                    name: topTrader.name,
                    usdVolume: topTrader.usdVolume
                }
            })
            .filter(t => t.usdVolume > 0)
            .sort((a, b) => b.date===a.date ? 0 : (moment(b.date).isBefore(moment(a.date)) ? -1 : 1))
    }

    tradersVolume() {
        let traders = []
        let fills = this.eligibleFills()
        for (let index = 0; index < fills.length; index++) {
            let fill = fills[index]
            let trader = traders.find(t => t.address === fill.address)
            if (trader) {
                trader.usdVolume += fill.usdTotalValue
            } else {
                traders.push(
                    {
                        address: fill.address,
                        name: fill.name,
                        usdVolume: fill.usdTotalValue
                    }
                )
            }
        }

        return traders.sort((a, b) => b.usdVolume - a.usdVolume)
    }

    totalVolume() {

        let volumes = {
            swaps: { usd: 0, count: 0 },
            limits: { usd: 0, count: 0 },
            total: { usd: 0, count: 0 }
        }

        let fills = this.eligibleFills()

        for (let index = 0; index < fills.length; index++) {
            let fill = fills[index]
            if (fill.isSwap) {
                volumes.swaps.usd += fill.usdTotalValue
                volumes.swaps.count += 1
            } else {
                volumes.limits.usd += fill.usdTotalValue
                volumes.limits.count += 1
            }
            volumes.total.usd += fill.usdTotalValue
            volumes.total.count += 1
        }

        return volumes
    }

    refreshFills(source) {
        this.synchoHandle = setInterval((obj) => obj.fetchFills(source), 60000, this)
    }

    async fetchFills(source, page = 1) {
        try {
            let fills =
                await fetchJson(`https://api.metric.exchange/fills?page=${page}&dateFrom=${this.startDate.value.format('YYYY-MM-DD')}`)

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
            let fill = await this.extractFillData(fills[index])

            if (fill.usdValue === undefined) {
                let usdPrice = await CoinPriceProxy.fetchCoinPriceAt(fill.makerTokenAddress , moment(fill.date))
                if (usdPrice === undefined) {
                    usdPrice = await CoinPriceProxy.fetchCoinPriceAt(fill.takerTokenAddress , moment(fill.date))
                    fill.usdValue = usdPrice * fill.takerTokenAmount
                } else {
                    fill.usdValue = usdPrice * fill.makerTokenAmount
                }
            }

            if (!storedFills.find(f => f.id === fill.id)) {

                let concurrentFills = storedFills.filter(f => f.transactionHash === fill.transactionHash)

                let parentFill = concurrentFills.find(f =>
                    f.details.takerTokenAddress === fill.makerTokenAddress
                    && f.details.takerAmount === fill.makerTokenAmount
                )

                let childFill = concurrentFills.find(f =>
                    f.details.makerTokenAddress === fill.takerTokenAddress
                    && f.details.makerAmount === fill.takerTokenAmount
                )

                if (childFill) {
                    childFill.ignore = true
                }

                if (parentFill) {
                    parentFill.ignore = true
                }

                storedFills.push({
                    id: fill.id,
                    address: fill.address,
                    name: fill.name,
                    date: fill.date,
                    transactionHash: fill.transactionHash,
                    details: {
                        makerTokenSymbol: fill.makerTokenSymbol,
                        makerTokenAddress: fill.makerTokenAddress,
                        makerAmount: fill.makerTokenAmount,
                        takerTokenSymbol: fill.takerTokenSymbol,
                        takerTokenAddress: fill.takerTokenAddress,
                        takerAmount: fill.takerTokenAmount
                    },
                    usdTotalValue: fill.usdValue,
                    usdMetricValue: fill.isMetricTrade ? fill.usdValue: 0,
                    isSwap: fill.isSwap,
                    ignore: false
                })

                await this.fills.set(
                    source,
                    storedFills
                )
            }
        }
    }

    async extractFillData(fill) {
        let metric = fill.apps.find(r => r.id === this.app)
        if (metric.type === "relayer") {
            return {
                id: fill.id,
                date: fill.date.substring(0, 10),
                address: fill.makerAddress,
                name: await tryFormatWalletName(fill.makerAddress),
                usdValue: fill.value.USD ? fill.value.USD : 0,
                isMetricTrade: fill.assets.find(a => { return a.tokenAddress.toUpperCase() === METRIC_TOKEN_ADDRESS.toUpperCase() }) !== undefined,
                makerTokenSymbol: fill.assets.find(a => a.traderType === "maker").tokenSymbol,
                makerTokenAddress: fill.assets.find(a => a.traderType === "maker").tokenAddress,
                makerTokenAmount: parseFloat(fill.assets.find(a => a.traderType === "maker").amount),
                takerTokenSymbol: fill.assets.find(a => a.traderType === "taker").tokenSymbol,
                takerTokenAddress: fill.assets.find(a => a.traderType === "taker").tokenAddress,
                takerTokenAmount: parseFloat(fill.assets.find(a => a.traderType === "taker").amount),
                hash: fill.transactionHash,
                isSwap: false
            }
        }

        if (metric.type === "consumer") {
            return {
                id: fill.id,
                date: fill.date.substring(0, 10),
                address: this.extractTakerAddress(fill),
                name: await tryFormatWalletName(this.extractTakerAddress(fill)),
                usdValue: fill.value.USD ? fill.value.USD : 0,
                isMetricTrade: fill.assets.find(a => { return a.tokenAddress.toUpperCase() === METRIC_TOKEN_ADDRESS.toUpperCase() }) !== undefined,
                makerTokenSymbol: fill.assets.find(a => a.traderType === "maker").tokenSymbol,
                makerTokenAddress: fill.assets.find(a => a.traderType === "maker").tokenAddress,
                makerTokenAmount: parseFloat(fill.assets.find(a => a.traderType === "maker").amount),
                takerTokenAddress: fill.assets.find(a => a.traderType === "taker").tokenAddress,
                takerTokenSymbol: fill.assets.find(a => a.traderType === "taker").tokenSymbol,
                takerTokenAmount: parseFloat(fill.assets.find(a => a.traderType === "taker").amount),
                hash: fill.transactionHash,
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

    eligibleFills() {
        return this.fills.value.filter(f => !f.ignore)
    }

}