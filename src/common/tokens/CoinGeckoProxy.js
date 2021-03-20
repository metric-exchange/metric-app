import {fetchJson} from "../json_api_fetch";
import {tokensList} from "./token_fetch";
import {chainToken, isConnectedToEthereumMainNet} from "../ChainHelpers";

export class CoinGeckoProxy {

    constructor() {}

    async fetchCoinPriceAt(tokenAddress, date) {
        if (isConnectedToEthereumMainNet()) {
            try {
                let coin = undefined
                if (tokenAddress === chainToken().address) {
                    coin = await fetchJson(`https://api.coingecko.com/api/v3/coins/ethereum`)
                } else {
                    coin = await fetchJson(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddress.toLowerCase()}`)
                }
                if (coin && coin.id) {
                    let formattedDate = date.format("DD-MM-YYYY")
                    let coinInfo =
                        await fetchJson(`https://api.coingecko.com/api/v3/coins/${coin.id}/history?date=${formattedDate}&localization=false`)

                    if (coinInfo.market_data && coinInfo.market_data.current_price) {
                        return coinInfo.market_data.current_price.usd
                    }
                }
            } catch (e) {
                console.warn("Could not fetch token price", e)
            }
        }

        return undefined
    }

}

export let CoinPriceProxy = new CoinGeckoProxy()