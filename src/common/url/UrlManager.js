import {findOrAddTokenWithAddress} from "../tokens/token_fetch";
import {chainToken, getConnectedNetworkConfig, isConnectedToEthereumMainNet} from "../ChainHelpers";

export class UrlManager {

    constructor() {}

    async urlSellToken() {
        let token = UrlManager.defaultSellToken()
        let url = window.location.href.split('/#/')
        if (url.length === 2) {
            let addresses = url[1].split('/')
            if (addresses.length === 2) {
                let requestedToken = await findOrAddTokenWithAddress(addresses[0])
                if (requestedToken !== undefined) {
                    token = requestedToken
                }
            }
        }
        return token
    }

    async urlBuyToken() {
        let token = UrlManager.defaultBuyToken()
        let url = window.location.href.split('/#/')
        if (url.length === 2) {
            let addresses = url[1].split('/')
            if (addresses.length === 2) {
                let requestedToken = await findOrAddTokenWithAddress(addresses[1])
                if (requestedToken !== undefined) {
                    token = requestedToken
                }
            }
        }
        return token
    }

    static defaultSellToken() {
        return chainToken()
    }

    static defaultBuyToken() {
        let config = getConnectedNetworkConfig()
        if (isConnectedToEthereumMainNet()) {
            return config.defaultTokens.find(t => t.symbol.toLowerCase() === "metric")
        }

        return config.defaultTokens.find(t => t.symbol.toLowerCase() === "busd")
    }

    static metricToken() {
        let config = getConnectedNetworkConfig()
        if (isConnectedToEthereumMainNet()) {
            return config.defaultTokens.find(t => t.symbol.toLowerCase() === "metric")
        }

        return config.defaultTokens.find(t => t.symbol.toLowerCase() === "bmetric")
    }

    updateUrl(sellToken, buyToken) {
        history.replaceState(
            {},
            '',
            `/#/${sellToken.address}/${buyToken.address}`)
    }

}
