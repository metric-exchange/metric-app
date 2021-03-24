import {HttpClient} from "@0x/connect";
import {getProvider} from "../wallet/WalletManager";
import {getContractAddressesForChainOrThrow} from "@0x/contract-addresses";
import {BigNumber, providerUtils} from "@0x/utils";

export class ZeroXV3OrderBook {

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
            if (ZeroXV3OrderBook.isValidOrder(bid, keepOtcOrders)) {
                filteredBids.push(ZeroXV3OrderBook.buildOrder(bid, quoteToken, baseToken))
            }
        }

        for(let ask of orders.asks.records) {
            if (ZeroXV3OrderBook.isValidOrder(ask, keepOtcOrders)) {
                filteredAsks.push(ZeroXV3OrderBook.buildOrder(ask, baseToken, quoteToken))
            }
        }

        return {
            bids: filteredBids,
            asks: filteredAsks
        }

    }

    static isValidOrder(order, keepOtcOrders) {
        let remainingPercentage =
            new BigNumber(order.metaData.remainingFillableTakerAssetAmount)
                .multipliedBy(100)
                .dividedBy(order.order.takerAssetAmount)

        return remainingPercentage.isGreaterThan(1) &&
            (keepOtcOrders || order.order.takerAddress === "0x0000000000000000000000000000000000000000")
    }

    static buildOrder(order, baseToken, quoteToken) {
        let remainingTakerAmount = new BigNumber(order.metaData.remainingFillableTakerAssetAmount)
        return {
            makerAmount: order.order.makerAssetAmount
                .dividedBy(10 ** baseToken.decimals)
                .multipliedBy(remainingTakerAmount)
                .dividedBy(order.order.takerAssetAmount),
            takerAmount: remainingTakerAmount
                .dividedBy(10 ** quoteToken.decimals),
            price: order.order.makerAssetAmount
                        .dividedBy(10 ** baseToken.decimals)
                        .dividedBy(order.order.takerAssetAmount)
                        .multipliedBy(10 ** quoteToken.decimals)
        }
    }

    static relayClient = new HttpClient("https://api.0x.org/sra/v3")

}

export async function zeroXContractAddresses() {
    let chainId = await providerUtils.getChainIdAsync(getProvider())
    return getContractAddressesForChainOrThrow(chainId)
}
