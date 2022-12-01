import {tokensList} from "./tokens/token_fetch";
import {
    isConnectedToEthereumMainNet,
    metricLpToken,
    metricShareContract,
    metricShareVaultContract,
    metricToken
} from "./ChainHelpers";
import {MetricShare} from "./staking/MetricShare";
import {BigNumber} from "@0x/utils";
import {Erc20ContractProxy} from "./Erc20ContractProxy";

export let MetricReferralAddress = "0x52427b0035F494a21a0A4A1AbE04d679f789c821"

export async function calculateMetricFee(accountAddress) {
    return 0;
}

async function fetchFeeEligibleTokenBalance(accountAddress) {
    let metricBalance = fetchMetricBalance()
    let xmetricBalance = await fetchxMetricBalance(accountAddress)
    let xLpBalance = await fetchxMetricLpBalance(accountAddress)

    return BigNumber.max(
        metricBalance.isNaN() ? new BigNumber(0) : metricBalance,
        xmetricBalance.isNaN() ? new BigNumber(0) : xmetricBalance,
        xLpBalance.isNaN() ? new BigNumber(0) : xLpBalance
    )
}

function fetchMetricBalance() {

    let metric = tokensList().find(t => t.symbol.toLowerCase() === "metric")
    if (metric !== undefined) {
        return metric.balance
    }

    return new BigNumber(0)
}

async function fetchxMetricBalance(accountAddress) {
    let shareContract = metricShareContract()
    if (!shareContract) {
        return new BigNumber(0)
    }

    let share = new MetricShare(shareContract, metricToken())

    await share.refreshInfo()
    let userShares = await share.shares(accountAddress)

    return userShares.multipliedBy(share.sharePrice)
}

async function fetchxMetricLpBalance(accountAddress) {
    let shareContract = metricShareVaultContract()
    if (!shareContract) {
        return new BigNumber(0)
    }

    let lp = new Erc20ContractProxy.erc20Contract(metricLpToken())
    let metric = new Erc20ContractProxy.erc20Contract(metricToken())
    let share = new MetricShare(shareContract, metricLpToken())
    await share.refreshInfo()

    let userShares = await share.shares(accountAddress)

    let lpBalance = userShares.multipliedBy(share.sharePrice)
    let lpSupply = new BigNumber(await lp.methods.totalSupply().call()).dividedBy(10 ** 18)
    let lpMetricSupply = new BigNumber(await metric.methods.balanceOf(metricLpToken()).call()).dividedBy(10 ** 18)

    return lpMetricSupply.multipliedBy(lpBalance).dividedBy(lpSupply)
}