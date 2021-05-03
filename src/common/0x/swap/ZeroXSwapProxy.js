import {fetchJson} from "../../JsonApiFetch";
import {stringify} from "query-string";
import {BigNumber} from "@0x/utils";
import {getSlippageConfig} from "../../order/SlippageConfig";
import {accountAddress} from "../../wallet/WalletManager";
import {calculateMetricFee, MetricReferralAddress} from "../../MetricFee";
import {getConnectedNetworkConfig} from "../../ChainHelpers";

export async function getSwapPrice(inputToken, outputToken, sellAmount = new BigNumber(1)) {
    try {
        let correctedAmount = sellAmount.isNaN() ? new BigNumber(1) : sellAmount
        let quote = await callSwapApi({
            sellToken: inputToken.address,
            buyToken: outputToken.address,
            sellAmount: `${new BigNumber(correctedAmount).multipliedBy(10 ** inputToken.decimals).integerValue(BigNumber.ROUND_DOWN)}`,
            slippagePercentage: getSlippageConfig(),
            takerAddress: accountAddress(),
            intentOnFilling: false,
            skipValidation: true,
            buyTokenPercentageFee: calculateMetricFee(),
            feeRecipient : MetricReferralAddress
        })

        if (quote.price !== null) {
            return {
                price: new BigNumber(quote.price),
                gasCost: new BigNumber(quote.gas).multipliedBy(quote.gasPrice).dividedBy(10 ** 18),
                routes: extractRoutes(quote)
            }
        }
    } catch (e) {
        console.warn(`Failed to fetch swap price. ${e}`)
    }

    return {
        price: new BigNumber(0),
        gasCost: new BigNumber(0),
        routes: []
    }
}

export async function getSwapPriceForBuy(inputToken, outputToken, buyAmount = 1) {
    try {
        let quote = await callSwapApi({
            sellToken: inputToken.address,
            buyToken: outputToken.address,
            buyAmount: `${new BigNumber(buyAmount).multipliedBy(10 ** outputToken.decimals).integerValue(BigNumber.ROUND_DOWN)}`,
            slippagePercentage: getSlippageConfig(),
            takerAddress: accountAddress(),
            intentOnFilling: false,
            skipValidation: true,
            buyTokenPercentageFee: calculateMetricFee(),
            feeRecipient : MetricReferralAddress
        })

        if (quote.price !== null) {
            return {
                price: new BigNumber(1).dividedBy(new BigNumber(quote.price)),
                gasCost: new BigNumber(quote.gas).multipliedBy(quote.gasPrice).dividedBy(10 ** 18),
                routes: extractRoutes(quote)
            }
        }
    } catch (e) {
        console.warn(`Failed to fetch swap buy price. ${e}`)
    }

    return {
        price: new BigNumber(0),
        gasCost: new BigNumber(0),
        routes: []
    }
}

export async function callSwapApi(params) {
    let networkConfig = getConnectedNetworkConfig()
    return await fetchJson(`${networkConfig.uris.zeroX}/swap/v1/quote?${stringify(params)}`)
}

function extractRoutes(quote) {
    return quote.sources.filter(s => s.proportion !== "0")
}