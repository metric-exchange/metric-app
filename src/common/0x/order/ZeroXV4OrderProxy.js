import {fetchJson, postJson} from "../../JsonApiFetch";
import {LimitOrder, SignatureType} from "@0x/protocol-utils";
import {generatePseudoRandom256BitNumber} from '@0x/utils'
import {accountAddress, ConnectedNetworkId, getProvider} from "../../wallet/WalletManager";
import {MetricReferralAddress} from "../../MetricFee";
import {getConnectedNetworkConfig} from "../../ChainHelpers";
import {ExchangeProxyV4Address} from "../../tokens/token_fetch";

export class ZeroXV4OrderProxy {

    constructor() {
        let networkConfig = getConnectedNetworkConfig()
        this.url = `${networkConfig.uris.zeroX}/orderbook/v1`
    }

    async sendOrder(order) {
        let signedOrder = await this.buildSignedOrder(order)
        return await postJson(`${this.url}/orders`, [signedOrder])
    }

    async buildSignedOrder(orderParams) {

        const order = new LimitOrder({
            chainId: ConnectedNetworkId,
            maker: accountAddress().toLowerCase(),
            makerToken: orderParams.makerToken.toLowerCase(),
            takerToken: orderParams.takerToken.toLowerCase(),
            makerAmount: orderParams.makerAmount,
            takerAmount: orderParams.takerAmount,
            pool: "0x0000000000000000000000000000000000000000000000000000000000000037",
            salt: generatePseudoRandom256BitNumber(),
            verifyingContract: ExchangeProxyV4Address.toLowerCase(),
            expiry: orderParams.expiry,
            takerTokenFeeAmount: orderParams.takerFeeAmount,
            feeRecipient: MetricReferralAddress.toLowerCase()
        });

        const signature = await order.getSignatureWithProviderAsync(
            getProvider(),
            SignatureType.EIP712,
        );

        return {
            ...order,
            signature
        }
    }

    async getOrders(address) {
        try {
            let orders = await fetchJson(`${this.url}/orders?maker=${address.toLowerCase()}`, { method: 'GET'})
            return orders.records
        } catch (e) {
            console.warn(`Failed to get order list, ${e}`)
        }
        return []
    }

}