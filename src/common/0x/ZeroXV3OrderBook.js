import {HttpClient} from "@0x/connect";
import {getProvider} from "../wallet/WalletManager";
import {getContractAddressesForChainOrThrow} from "@0x/contract-addresses";
import {tokensList} from "../tokens/token_fetch";
import {providerUtils} from "@0x/utils";
import Rollbar from "rollbar";

export class ZeroXV3OrderBook {

    constructor(baseToken, quoteToken) {
        this.baseToken = baseToken
        this.quoteToken = quoteToken

        this.bids = []
        this.asks = []

        this.observers = []
        this.activeSyncroLoopId = setInterval((obj) => obj.runSynchronizationLoop(), 10000, this)
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
        this.activeSyncroLoopId = setInterval((obj) => obj.runSynchronizationLoop(), 10000, this)
    }

    observe(observer) {
        this.observers.push(observer)
    }

    async runSynchronizationLoop(id) {

        try {
            let orderBookUpdate =
                await ZeroXV3OrderBook.getOrdersMatching(
                    this.baseToken,
                    this.quoteToken,
                    false
                )

            this.bids = orderBookUpdate.bids
            this.asks = orderBookUpdate.asks

            await Promise.all(
                this.observers.map(obj => obj.onOrderBookUpdate())
            )

        } catch (e) {
            console.warn(`Unexpected error while synchronizing the order book, will keep retrying. ${e}`)
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
