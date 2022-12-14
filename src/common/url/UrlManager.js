import {findOrAddTokenWithAddress} from "../tokens/token_fetch";
import {
    chainToken,
    getConnectedNetworkConfig, isConnectedToArbitrumMainnet,
    isConnectedToAvalancheMainnet,
    isConnectedToCeloMainnet, isConnectedToOptimismMainnet,
} from "../ChainHelpers";

export class UrlManager {

    constructor(base) {
        this.setBase(base)
    }

    setBase(base) {
        this.base = `/#/${base}/`
    }

    async urlSellToken() {
        let token = UrlManager.defaultSellToken()
        let url = window.location.href.split(this.base)
        if (url.length === 2) {
            let addresses = url[1].split('/')
            if (addresses.length === 2) {
                let requestedToken = await findOrAddTokenWithAddress(addresses[0].toLowerCase())
                if (requestedToken !== undefined) {
                    token = requestedToken
                }
            }
        }
        return token
    }

    async urlBuyToken() {
        let token = UrlManager.defaultBuyToken()
        let url = window.location.href.split(this.base)
        if (url.length === 2) {
            let addresses = url[1].split('/')
            if (addresses.length === 2) {
                let requestedToken = await findOrAddTokenWithAddress(addresses[1].toLowerCase())
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
        if (isConnectedToAvalancheMainnet()) {
            return getConnectedNetworkConfig().defaultTokens.find(t => t.symbol.toLowerCase() === "usdt.e");
        }
        if (isConnectedToCeloMainnet()) {
            return getConnectedNetworkConfig().defaultTokens.find(t => t.symbol.toLowerCase() === "cusd");
        }
        if (isConnectedToOptimismMainnet()) {
            return getConnectedNetworkConfig().defaultTokens.find(t => t.symbol.toLowerCase() === "usdc");
        }
        if (isConnectedToArbitrumMainnet()) {
            return getConnectedNetworkConfig().defaultTokens.find(t => t.symbol.toLowerCase() === "usdc");
        }
        return this.metricToken()
    }

    static metricToken() {
        return getConnectedNetworkConfig().defaultTokens.find(t => t.symbol.toLowerCase() === "metric")
    }

    sanitizeUrl() {
        let path = window.location.hash

        if (path === "#/trade" || path.startsWith("#/trade/")) {
            return false
        }

        if (path === "#/compete" || path.startsWith("#/compete/")) {
            return false
        }

        history.replaceState({}, '',"/")

        return true
    }

    updateUrl(sellToken, buyToken) {
        history.replaceState(
            {},
            '',
            `${this.base}${sellToken.address}/${buyToken.address}`)
    }

}
