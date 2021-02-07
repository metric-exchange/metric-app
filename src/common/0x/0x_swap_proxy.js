import {fetchJson} from "../json_api_fetch";
import {stringify} from "query-string";
import {BigNumber} from "@0x/utils";
import {getSlippageConfig} from "../order/SlippageConfig";
import Rollbar from "rollbar";
import {accountAddress} from "../wallet/wallet_manager";
import {calculateMetricFee, MetricReferralAddress} from "../metric_fee";

export async function getSwapPrice(inputToken, outputToken, sellAmount = 1) {
    try {
        let quote = await callSwapApi({
            sellToken: inputToken.address,
            buyToken: outputToken.address,
            sellAmount: `${new BigNumber(sellAmount).multipliedBy(10 ** inputToken.decimals).integerValue(BigNumber.ROUND_DOWN)}`,
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
                gasCost: new BigNumber(quote.gas).multipliedBy(1.5).multipliedBy(quote.gasPrice).dividedBy(10 ** 18)
            }
        }
    } catch (e) {
        Rollbar.warn(`Failed to fetch swap price. ${e}`)
    }

    return {
        price: new BigNumber(0),
        gasCost: new BigNumber(0)
    }
}

export async function getSwapPriceForBuy(inputToken, outputToken, buyAmount = 1) {
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
            gasCost: new BigNumber(quote.gas).multipliedBy(1.5).multipliedBy(quote.gasPrice).dividedBy(10 ** 18)
        }
    }

    return {
        price: new BigNumber(0),
        gasCost: new BigNumber(0)
    }
}

export async function callSwapApi(params) {
    return await fetchJson(`https://api.0x.org/swap/v1/quote?${stringify(params)}`)
}