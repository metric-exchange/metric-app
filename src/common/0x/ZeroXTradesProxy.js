import {ObservableValue} from "../order/ObservableValue";
import {fetchJson} from "../json_api_fetch";

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
            console.error('Failed to fetch order fills', e)
        }
    }

    async fetchFillDetails(id) {
        return await fetchJson(`https://api.0xtracker.com/fills/${id}`)
    }

    async updateFills(source, address, fills) {
        let storedFills = [...this.fills.value]
        let newFills = fills.map(f => {
            return this.extractFillData(f, address)
        })

        storedFills = storedFills.concat(newFills)

        await this.fills.set(
            source,
            storedFills
        )
    }

    extractFillData(fill, address) {
        if (fill.makerAddress === address) {
            return {
                id: fill.id,
                date: fill.date.substring(0, 10),
                details: {
                    makerTokenSymbol: fill.assets.find(a => a.traderType === "maker").tokenSymbol,
                    makerTokenAmount: parseFloat(fill.assets.find(a => a.traderType === "maker").amount),
                    takerTokenSymbol: fill.assets.find(a => a.traderType === "taker").tokenSymbol,
                    takerTokenAmount: parseFloat(fill.assets.find(a => a.traderType === "taker").amount)
                }
            }
        } else if (this.extractTakerAddress(fill) === address) {
            return {
                id: fill.id,
                date: fill.date.substring(0, 10),
                details: {
                    takerTokenSymbol: fill.assets.find(a => a.traderType === "maker").tokenSymbol,
                    takerTokenAmount: parseFloat(fill.assets.find(a => a.traderType === "maker").amount),
                    makerTokenSymbol: fill.assets.find(a => a.traderType === "taker").tokenSymbol,
                    makerTokenAmount: parseFloat(fill.assets.find(a => a.traderType === "taker").amount)
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