// @flow

import {Token} from "./token";
import {EthereumNetworkId} from "../constants";
import {ConnectedNetworkId} from "../wallet/WalletManager";

export class CustomTokenManager {

    constructor() {
        this.customtokens = {
            version: 2,
            chains: []
        }
    }

    addToken(token: Token) {

        let chainInfo = this.customtokens.chains.find(ch => ch.id === ConnectedNetworkId);
        if (chainInfo === undefined) {
            let index = this.customtokens.chains.push({
                id: ConnectedNetworkId,
                tokens: []
            })
            chainInfo = this.customtokens.chains[index - 1];
        }

        if (chainInfo.tokens.find(t => t.address === token.address) === undefined) {
            chainInfo.tokens.push(token)
            this.persist()
        }
    }

    persist() {
        localStorage.setItem(this.customTokensTag, JSON.stringify(this.customtokens))
    }

    init() {
        let persistedTokens = localStorage.getItem(this.customTokensTag)
        if (persistedTokens !== null) {
            this.merge(JSON.parse(persistedTokens))
        }
    }

    merge(persistedTokens) {
        if (persistedTokens.version === 1) {
            this.customtokens = {
                version: 2,
                chains: [
                    {
                        id: EthereumNetworkId,
                        tokens: persistedTokens.tokens
                    }
                ]
            }
        } else {
            this.customtokens = persistedTokens
        }
    }

    customTokensTag = "custom-tokens"
}
