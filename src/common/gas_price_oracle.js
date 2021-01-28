import {fetchJson} from "./json_api_fetch";
import Rollbar from "rollbar";

export async function getFastGasPriceInWei() {
    let fastGasPrice = await getEtherChainFasGasPriceInWei()
    let standardsGasPrice = await getDefaultGasPriceInWei()
    return Math.max(fastGasPrice, Math.round(standardsGasPrice * 1.25))
}

async function getEtherChainFasGasPriceInWei() {

    let fastGasPrice = 0

    try {
        let gasPrices = await fetchJson("https://www.etherchain.org/api/gasPriceOracle")

        if (gasPrices !== undefined && gasPrices.fast !== undefined) {
            fastGasPrice = gasPrices.fast
        }
    } catch (e) {
        Rollbar.warn("Call to price oracle has failed, fallbacking on web3 gas price")
    }

    return fastGasPrice * (10 ** 9)
}

async function getDefaultGasPriceInWei() {
    return await window.web3Modal.eth.getGasPrice()
}
