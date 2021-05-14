import {fetchJson, postJson} from "../../JsonApiFetch";
import Rollbar from "rollbar";
import {RfqOrder, SignatureType} from "@0x/protocol-utils";
import {generatePseudoRandom256BitNumber} from '@0x/utils'
import {ObservableValue} from "../../order/ObservableValue";
import {accountAddress, getProvider} from "../../wallet/WalletManager";

export class HidingGameProxy {

    constructor() {
        this.url = "https://hidingbook.keeperdao.com/api/v1"
        this.supportedTokens = new ObservableValue([])
    }

    async init() {
        if (this.trxOrigin === undefined) {
            try {
                let info = await fetchJson(`${this.url}/info`)
                this.trxOrigin = info.result.orderDetails.txOrigin
                await this.supportedTokens.set(undefined, info.result.tokenList.tokens)
                this.pool = info.result.orderDetails.pool
                this.taker = info.result.orderDetails.taker
                this.verifyingContract = info.result.orderDetails.verifyingContract
            } catch (e) {
                Rollbar.error(`Failed to initialize hidingGame info, ${e}`)
            }
        }
    }

    async buildSignedOrder(orderParams) {

        const order = new RfqOrder({
            maker: accountAddress().toLowerCase(),
            makerToken: orderParams.makerToken.toLowerCase(),
            takerToken: orderParams.takerToken.toLowerCase(),
            makerAmount: orderParams.makerAmount,
            takerAmount: orderParams.takerAmount,
            txOrigin: this.trxOrigin,
            pool: this.pool,
            salt: generatePseudoRandom256BitNumber(),
            verifyingContract: this.verifyingContract,
            taker: this.taker,
            expiry: orderParams.expiry
        });

        const signature = await order.getSignatureWithProviderAsync(
            getProvider(),
        );

        // to activate when this is released: https://github.com/MetaMask/metamask-extension/pull/11064
        // const signature = await order.getSignatureWithProviderAsync(
        //     getProvider(),
        //     SignatureType.EIP712,
        // );

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
            console.warn(`Failed to get order list, ${e}`)
        }
        return []
    }

}