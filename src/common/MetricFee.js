import {tokensList} from "./tokens/token_fetch";
import {isConnectedToEthereumMainNet} from "./ChainHelpers";

export let MetricReferralAddress = "0x52427b0035F494a21a0A4A1AbE04d679f789c821"

export function calculateMetricFee() {
    if (isConnectedToEthereumMainNet()) {
        return fetchMetricBalance() >= 200 ? 0.001 : 0.003
    }

    return 0.001
}

export function fetchMetricBalance() {

    let metric = tokensList().find(t => t.symbol.toLowerCase() === "metric")
    if (metric !== undefined) {
        return metric.balance
    }

    return 0
}

