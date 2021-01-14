import {DAI_TOKEN_ADDRESS, findOrAddTokenWithAddress, METRIC_TOKEN_ADDRESS, tokensList} from "../tokens/token_fetch";

export class UrlManager {

    constructor() {
        this.defaultSellTokenAdress = METRIC_TOKEN_ADDRESS
        this.defaultBuyTokenAdress = DAI_TOKEN_ADDRESS
    }

    async urlSellToken() {
        let token = tokensList().find(t => t.address === this.defaultSellTokenAdress)
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
        let token = tokensList().find(t => t.address === this.defaultBuyTokenAdress)
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

    updateUrl(sellToken, buyToken) {
        history.replaceState(
            {},
            '',
            `/#/${sellToken.address}/${buyToken.address}`)
    }

}
