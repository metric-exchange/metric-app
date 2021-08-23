import {BigNumber} from "@0x/utils";
import {fetchJson} from "../../JsonApiFetch";
import {OrderBookProxy} from "./OrderBookProxy";
import {getConnectedNetworkConfig} from "../../ChainHelpers";

export class ZeroXV4OrderBookProxy extends OrderBookProxy {

    constructor() {
        super();
    }

    async getOrdersAsync(baseToken, quoteToken) {
        let networkConfig = getConnectedNetworkConfig()
        return await fetchJson(
            `${networkConfig.uris.zeroX}/sra/v4/orderbook?perPage=500&baseToken=${baseToken.address.toLowerCase()}&quoteToken=${quoteToken.address.toLowerCase()}`
        )
    }

    extractOrderInfo(order) {
        return {
            remainingFillableTakerAmount: new BigNumber(order.metaData.remainingFillableTakerAmount),
            makerAmount: new BigNumber(order.order.makerAmount),
            takerAmount: new BigNumber(order.order.takerAmount),
            takerAddress: order.order.taker
        }
    }

}
