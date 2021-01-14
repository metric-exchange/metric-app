import {fetchJson} from "../json_api_fetch";
import {stringify} from "query-string";
import {BigNumber} from "@0x/utils";
import {DEFAULT_SWAP_SLIPPAGE} from "../order/constants";

export async function getSwapPrice(inputToken, outputToken, sellAmount = 1) {
    let quote = await callPriceApi({
        sellToken: inputToken.address,
        buyToken: outputToken.address,
        sellAmount: `${new BigNumber(sellAmount).multipliedBy(10 ** inputToken.decimals).integerValue(BigNumber.ROUND_DOWN)}`,
        slippagePercentage: DEFAULT_SWAP_SLIPPAGE
    })

    if (quote.price !== null) {
        return parseFloat(quote.price)
    } else {
        return NaN
    }
}

export async function getSwapPriceWithForBuy(inputToken, outputToken, buyAmount = 1) {
    let quote = await callPriceApi({
        sellToken: inputToken.address,
        buyToken: outputToken.address,
        buyAmount: `${new BigNumber(buyAmount).multipliedBy(10 ** outputToken.decimals).integerValue(BigNumber.ROUND_DOWN)}`,
        slippagePercentage: DEFAULT_SWAP_SLIPPAGE
    })

    if (quote.price !== null) {
        return 1 / parseFloat(quote.price)
    } else {
        return NaN
    }
}

export async function callSwapApi(params) {
    return await fetchJson(`https://api.0x.org/swap/v1/quote?${stringify(params)}`)
}

export async function callPriceApi(params) {
    return await fetchJson(`https://api.0x.org/swap/v1/price?${stringify(params)}`)
}