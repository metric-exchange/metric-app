import {ObservableValue} from "../../order/ObservableValue";
import {fetchJson} from "../../JsonApiFetch";
import {ConnectedNetworkId} from "../../wallet/WalletManager";
import {EthereumNetworkId} from "../../constants";

export class ZeroXTrackerTradesProxy {
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
        if (ConnectedNetworkId === EthereumNetworkId) {
            try {
                let fills = await fetchJson(`https://api.0xtracker.com/fills?trader=${address.toLowerCase()}&page=${page}&limit=50`)

                await this.updateFills(source, address.toLowerCase(), fills.fills)

                if (page < fills.pageCount) {
                    await this.fetchFills(source, address.toLowerCase(),page + 1)
                }

            } catch (e) {
                console.warn(`Failed to fetch order fills. ${e}`)
            }
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
            .filter(f => f !== undefined)

        storedFills = storedFills.concat(newFills)

        await this.fills.set(
            source,
            storedFills
        )
    }

    extractFillData(fill, address) {

        let makerToken = fill.assets.find(a => a.traderType === "maker")
        let takerToken = fill.assets.find(a => a.traderType === "taker")

        if (fill.makerAddress === address || fill.takerAddress === address) {
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
        } else {
            return undefined
        }
    }

}