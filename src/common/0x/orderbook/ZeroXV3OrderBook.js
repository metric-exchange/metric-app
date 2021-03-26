import {HttpClient} from "@0x/connect";
import {BigNumber} from "@0x/utils";
import {OrderBookProxy} from "./OrderBookProxy";

export class ZeroXV3OrderBook extends OrderBookProxy {

    constructor() {
        super();
        this.relayClient = new HttpClient("https://api.0x.org/sra/v3")
    }

    async getOrdersAsync(baseToken, quoteToken) {
        const baseAssetData = `0xf47261b0000000000000000000000000${baseToken.address.substr(2).toLowerCase()}`
        const quoteAssetData = `0xf47261b0000000000000000000000000${quoteToken.address.substr(2).toLowerCase()}`

        return await this.relayClient.getOrderbookAsync(
            {
                baseAssetData: baseAssetData,
                quoteAssetData: quoteAssetData,
            },
            {
                perPage: 500
            }
        )
    }

    extractOrderInfo(order) {
        return {
            remainingFillableTakerAmount: new BigNumber(order.metaData.remainingFillableTakerAssetAmount),
            makerAmount: order.order.makerAssetAmount,
            takerAmount: order.order.takerAssetAmount,
            takerAddress: order.order.takerAddress
        }
    }

}