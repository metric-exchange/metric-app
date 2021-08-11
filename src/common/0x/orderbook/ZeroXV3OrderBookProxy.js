import {BigNumber} from "@0x/utils";
import {OrderBookProxy} from "./OrderBookProxy";
import {fetchJson} from "../../JsonApiFetch";

export class ZeroXV3OrderBookProxy extends OrderBookProxy {

    constructor() {
        super();
    }

    async getOrdersAsync(baseToken, quoteToken) {
        const baseAssetData = `0xf47261b0000000000000000000000000${baseToken.address.substr(2).toLowerCase()}`
        const quoteAssetData = `0xf47261b0000000000000000000000000${quoteToken.address.substr(2).toLowerCase()}`

        return await fetchJson(`https://api.0x.org/sra/v3/orderbook?baseAssetData=${baseAssetData}&quoteAssetData=${quoteAssetData}&perPage=500`);
    }

    extractOrderInfo(order) {
        return {
            remainingFillableTakerAmount: new BigNumber(order.metaData.remainingFillableTakerAssetAmount),
            makerAmount: new BigNumber(order.order.makerAssetAmount),
            takerAmount: new BigNumber(order.order.takerAssetAmount),
            takerAddress: order.order.takerAddress
        }
    }

}