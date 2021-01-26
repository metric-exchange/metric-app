import {fetchJson} from "../json_api_fetch";

export class CoinGeckoProxy {

    constructor() {
        this.coins = []
    }

    async init() {
        this.coins = await fetchJson("https://api.coingecko.com/api/v3/coins/list")
    }

    async fetchCoinPriceAt(symbol, date) {
        let formattedDate = date.format("DD-MM-YYYY")
        let coinId = this.coins.find(c => c.symbol.toLowerCase() === symbol.toLowerCase())
        if (coinId) {
            let coinInfo =
                await fetchJson(`https://api.coingecko.com/api/v3/coins/${coinId.id}/history?date=${formattedDate}&localization=false`)

            return coinInfo.market_data.current_price.usd
        }

        return undefined
    }

}