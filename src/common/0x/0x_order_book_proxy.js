import {HttpClient} from "@0x/connect";
import {getProvider} from "../wallet/wallet_manager";
import {getContractAddressesForChainOrThrow} from "@0x/contract-addresses";
import {tokensList} from "../tokens/token_fetch";
import {providerUtils} from "@0x/utils";
import Rollbar from "rollbar";

export class ZeroXOrderBook {

    constructor(baseToken, quoteToken) {
        this.baseToken = baseToken
        this.quoteToken = quoteToken

        this.bids = []
        this.asks = []

        this.observers = []
        this.activeSyncroLoopId = 0

        this.runSynchronizationLoop(this.activeSyncroLoopId)
    }

    setTokens(baseToken, quoteToken) {
        this.baseToken = baseToken
        this.quoteToken = quoteToken
        this.reset()
    }

    reset() {
        this.asks = []
        this.bids = []
        this.activeSyncroLoopId = this.activeSyncroLoopId + 1
        this.runSynchronizationLoop(this.activeSyncroLoopId)
    }

    observe(observer) {
        this.observers.push(observer)
    }

    async runSynchronizationLoop(id) {

        if (id !== this.activeSyncroLoopId) {
            return
        }

        try {
            let orderBookUpdate =
                await ZeroXOrderBook.getOrdersMatching(
                    this.baseToken,
                    this.quoteToken,
                    false
                )

            if (id === this.activeSyncroLoopId) {
                this.bids = orderBookUpdate.bids
                this.asks = orderBookUpdate.asks

                await Promise.all(
                    this.observers.map(obj => obj.onOrderBookUpdate())
                )
                setTimeout((that, id) => {
                    that.runSynchronizationLoop(id)
                }, 10000, this, id)
            }
        } catch (e) {
            console.warn(`Unexpected error while synchronizing the order book, will keep retrying. ${e}`)
            if (id === this.activeSyncroLoopId) {
                setTimeout((that, id) => {
                    that.runSynchronizationLoop(id)
                }, 1000, this, id)
            }
        }
    }

    static async getBidsMatching(baseTokenAddress, quoteTokenAddress) {
        let baseToken = tokensList().find(t => t.address === baseTokenAddress)
        let quoteToken = tokensList().find(t => t.address === quoteTokenAddress)
        let orders = await this.getOrdersMatching(baseToken, quoteToken, true)
        return orders.bids
    }

    static async getOrdersMatching(baseToken, quoteToken, keepOtcOrders) {

        const baseAssetData = `0xf47261b0000000000000000000000000${baseToken.address.substr(2).toLowerCase()}`
        const quoteAssetData = `0xf47261b0000000000000000000000000${quoteToken.address.substr(2).toLowerCase()}`

        let orders = await this.relayClient.getOrderbookAsync(
            {
                baseAssetData: baseAssetData,
                quoteAssetData: quoteAssetData,
            },
            {
                perPage: 500
            }
        )
        let filteredBids = []
        let filteredAsks = []

        for(let bid of orders.bids.records) {
            let isValidOrder =
                (keepOtcOrders || bid.order.takerAddress === "0x0000000000000000000000000000000000000000")

            if (isValidOrder) {
                filteredBids.push(bid)
            }
        }

        for(let ask of orders.asks.records) {
            let isValidOrder =
                (keepOtcOrders || ask.order.takerAddress === "0x0000000000000000000000000000000000000000")

            if (isValidOrder) {
                filteredAsks.push(ask)
            }
        }

        return {
            bids: filteredBids,
            asks: filteredAsks
        }

    }

    static relayClient = new HttpClient("https://api.0x.org/sra/v3")

}

export async function zeroXContractAddresses() {
    let chainId = await providerUtils.getChainIdAsync(getProvider())
    return getContractAddressesForChainOrThrow(chainId)
}
