import {fetchJson} from "../json_api_fetch";

export async function getTokenUsdPrice(address, symbol) {
    let id = tokenId(address, symbol)
    let price = 0

    let jsonRes = await fetchJson(url(address, symbol))

    if (jsonRes[id] !== undefined && jsonRes[id].usd !== undefined){
        price = jsonRes[id].usd
    }

    return price
}

function url(address, symbol) {
    let apiurl = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${address}&vs_currencies=usd`
    if (symbol.toLowerCase() === 'eth'){
        apiurl ="https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false"
    }
    return apiurl
}

function tokenId(address, symbol) {
    let tokenId = address.toLowerCase()
    if (symbol.toLowerCase() === "eth") {
        tokenId = "ethereum"
    }
    return tokenId
}
