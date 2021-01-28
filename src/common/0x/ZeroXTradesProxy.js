import {ObservableValue} from "../order/ObservableValue";
import {fetchJson} from "../json_api_fetch";
import Rollbar from "rollbar";

export class ZeroXTradesProxy {
    constructor() {
        this.fills = new ObservableValue([])
    }

    userTrades() {
        return this.fills.value
            .sort((a, b) => b.date===a.date ? 0 : (b.date < a.date ? -1 : 1))
    }

    async refreshFills(source, address) {
        this.fills.value = []
        await this.fetchFills(source, address)
    }

    async fetchFills(source, address, page = 1) {
        try {
            let detailedFills = []
            let fills = await fetchJson(`https://api.0xtracker.com/fills?trader=${address.toLowerCase()}&page=${page}`)

            await Promise.all(
                fills.fills.map(async (f) => {
                    detailedFills.push(await this.fetchFillDetails(f.id))
                })
            )

            await this.updateFills(source, address.toLowerCase(), detailedFills)

            if (page < fills.pageCount) {
                await this.fetchFills(source, address.toLowerCase(),page + 1)
            }

        } catch (e) {
            Rollbar.warn(`Failed to fetch order fills. ${e}`)
        }
    }

    async fetchFillDetails(id) {
        return await fetchJson(`https://api.0xtracker.com/fills/${id}`)
    }

    async updateFills(source, address, fills) {
        let storedFills = [...this.fills.value]
        let newFills =
            fills
            .filter(f => f.assets.find(a => a.type !== 'erc-20') === undefined)
            .map(f => {
                return this.extractFillData(f, address)
            })

        storedFills = storedFills.concat(newFills)

        await this.fills.set(
            source,
            storedFills
        )
    }

    extractFillData(fill, address) {

        let makerToken = fill.assets.find(a => a.traderType === "maker")
        let takerToken = fill.assets.find(a => a.traderType === "taker")

        if (!fill.orderHash || (fill.makerAddress === address && fill.orderHash)) {
            return {
                id: fill.id,
                date: fill.date.substring(0, 10),
                details: {
                    makerTokenSymbol: makerToken.tokenSymbol,
                    makerTokenAmount: parseFloat(makerToken.amount),
                    takerTokenSymbol: takerToken.tokenSymbol,
                    takerTokenAmount: parseFloat(takerToken.amount)
                }
            }
        } else if (this.extractTakerAddress(fill) === address && fill.orderHash) {
            return {
                id: fill.id,
                date: fill.date.substring(0, 10),
                details: {
                    takerTokenSymbol: makerToken.tokenSymbol,
                    takerTokenAmount: parseFloat(makerToken.amount),
                    makerTokenSymbol: takerToken.tokenSymbol,
                    makerTokenAmount: parseFloat(takerToken.amount)
                }
            }
        }
    }

    extractTakerAddress(fill) {
        if (fill.taker.isContract) {
            return fill.transactionFrom.address
        } else {
            return fill.takerAddress
        }
    }

}