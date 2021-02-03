import {fetchJson, postJson} from "../json_api_fetch";
import Rollbar from "rollbar";
import {RfqOrder, eip712SignTypedDataWithProviderAsync} from "@0x/protocol-utils";
import {ObservableValue} from "../order/ObservableValue";
import {accountAddress, getProvider} from "../wallet/wallet_manager";

export class HidingGameProxy {

    constructor() {
        this.url = "https://hidingbook.keeperdao.com/api/v1"
        this.supportedTokens = new ObservableValue([])
    }

    async init() {
        try {
            let info = await fetchJson(`${this.url}/info`)
            this.trxOrigin = info.result.orderDetails.txOrigin
            await this.supportedTokens.set(undefined, info.result.tokenList.tokens)
            this.pool = info.result.orderDetails.pool
            this.taker = info.result.orderDetails.taker
            this.verifyingContract = info.result.orderDetails.verifyingContract
        } catch (e) {
            Rollbar.warn(`Failed to initialize hidingGame info, ${e}`)
        }
    }

    async buildSignedOrder(orderParams) {

        const order = new RfqOrder({
            maker: accountAddress().toLowerCase(),
            makerToken: orderParams.makerAssetAddress.toLowerCase(),
            takerToken: orderParams.takerAssetAddress.toLowerCase(),
            makerAmount: orderParams.makerAssetAmount,
            takerAmount: orderParams.takerAssetAmount,
            txOrigin: this.trxOrigin,
            pool: this.pool,
            verifyingContract: this.verifyingContract,
            taker: this.taker,
            expiry: orderParams.expirationTimeSeconds
        });

        let signature = await eip712SignTypedDataWithProviderAsync(
            order.getEIP712TypedData(),
            accountAddress().toLowerCase(),
            getProvider()
        )

        return {
            maker: order.maker,
            taker: order.taker,
            makerAmount: order.makerAmount,
            takerAmount: order.takerAmount,
            makerToken: order.makerToken,
            takerToken: order.takerToken,
            salt: order.salt,
            expiry: order.expiry,
            chainId: order.chainId,
            txOrigin: order.txOrigin,
            pool: order.pool,
            verifyingContract: order.verifyingContract,
            signature: signature
        }
    }

    async sendOrder(order) {
        return await postJson(`${this.url}/orders`, [order])
    }

    async getOrders(address) {
        try {
            let orders = await fetchJson(`${this.url}/orders?maker=${address}`, { method: 'GET'})
            return orders.orders
        } catch (e) {
            Rollbar.warn(`Failed to get order list, ${e}`)
        }
        return []
    }

}