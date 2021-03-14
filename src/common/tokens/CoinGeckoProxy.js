import {fetchJson} from "../json_api_fetch";

export class CoinGeckoProxy {

    constructor() {}

    async fetchCoinPriceAt(tokenAddress, date) {
        let coin = await fetchJson(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddress.toLowerCase()}`)
        if (coin && coin.id) {
            let formattedDate = date.format("DD-MM-YYYY")
            let coinInfo =
                await fetchJson(`https://api.coingecko.com/api/v3/coins/${coin.id}/history?date=${formattedDate}&localization=false`)

            if (coinInfo.market_data && coinInfo.market_data.current_price) {
                return coinInfo.market_data.current_price.usd
            }
        }


        return undefined
    }

}

export let CoinPriceProxy = new CoinGeckoProxy()