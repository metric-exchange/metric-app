import {HttpClient} from "@0x/connect";
import {getProvider} from "../wallet/wallet_manager";
import {BigNumber, providerUtils} from "@0x/utils";
import {tokensList} from "../tokens/token_fetch";
import {getContractAddressesForChainOrThrow} from "@0x/contract-addresses";
import {getTokenUsdPrice} from "../tokens/token_price_proxy";

export function isOrderBookInitialized() {
    return orderBookInitialized;
}

export function registerForOrderBookUpdateEvents(object) {
    callbacksRegister.push(object)
}

export function registerForBaseTokenChange(object) {
    baseTokenChangeRegister.push(object)
}

export function getReplayClient() {
    return relayClient
}

export function getOrderBookBids() {
    return bids
}

export function getOrderBookAsks() {
    return asks
}

export async function synchronizeOrderBook() {

    if (tokenCouple.quoteToken !== null && tokenCouple.baseToken !== null) {
        try {
            await updateOrderBook()
        } catch (e) {
            console.error("Unexpected error while synchronizing the order book, will keep retrying")
        }
    }

    setTimeout(synchronizeOrderBook, 10000)
}

export async function setBaseToken(token) {
    tokenCouple.baseToken = token
    bids=[]
    asks = []
    orderBookInitialized = false
    baseTokenChangeRegister.forEach(c => c.onBaseTokenUpdate())
}


export function setQuoteToken(token) {
    tokenCouple.quoteToken = token
    bids=[]
    asks = []
    orderBookInitialized = false
    baseTokenChangeRegister.forEach(c => c.onBaseTokenUpdate())
}

export function getBaseToken() {
    return tokenCouple.baseToken
}

export function getQuoteToken() {
    return tokenCouple.quoteToken
}

export async function getBidsMatching(baseTokenAddress, quoteTokenAddress) {
    let orders = await getOrdersMatching(baseTokenAddress, quoteTokenAddress, true)
    return orders.bids
}

async function updateOrderBook() {
    let baseToken = getBaseToken()
    let quoteToken = getQuoteToken()

    let orderBookUpdate =
        await getOrdersMatching(
            baseToken.address,
            quoteToken.address,
            false
        )

    if (baseToken.symbol === getBaseToken().symbol && quoteToken.symbol === getQuoteToken().symbol) {
        bids = orderBookUpdate.bids
        asks = orderBookUpdate.asks

        orderBookInitialized = true

        await Promise.all(
            callbacksRegister.map(obj => obj.onOrderBookUpdate())
        )
    }

}

async function getOrdersMatching(baseTokenAddress, quoteTokenAddress, keepOtcOrders) {

    let baseToken = tokensList().find(t => t.address.toLowerCase() === baseTokenAddress.toLowerCase())
    let quoteToken = tokensList().find(t => t.address.toLowerCase() === quoteTokenAddress.toLowerCase())

    let baseTokenPrice = await getTokenUsdPrice(baseToken)
    let quoteTokenPrice = await getTokenUsdPrice(quoteToken)

    const baseAssetData = `0xf47261b0000000000000000000000000${baseToken.address.substr(2).toLowerCase()}`
    const quoteAssetData = `0xf47261b0000000000000000000000000${quoteToken.address.substr(2).toLowerCase()}`

    let orders = await relayClient.getOrderbookAsync(
        {
            baseAssetData: baseAssetData,
            quoteAssetData: quoteAssetData,
        }
    )
    let filteredBids = []
    let filteredAsks = []

    for(let bid of orders.bids.records) {
        let takerAmount =
            new BigNumber(parseInt(bid.metaData.remainingFillableTakerAssetAmount))
                .multipliedBy(baseTokenPrice)
                .dividedBy(10 ** baseToken.decimals)

        let isValidOrder = (isNaN(baseTokenPrice) || takerAmount.isGreaterThan(10)) &&
            (keepOtcOrders || bid.order.takerAddress === "0x0000000000000000000000000000000000000000")

        if (isValidOrder) {
            filteredBids.push(bid)
        }
    }

    for(let ask of orders.asks.records) {
        let takerAmount =
            new BigNumber(parseInt(ask.metaData.remainingFillableTakerAssetAmount))
                .multipliedBy(quoteTokenPrice)
                .dividedBy(10 ** quoteToken.decimals)

        let isValidOrder = (isNaN(quoteTokenPrice) || takerAmount.isGreaterThan(10) )&&
            (keepOtcOrders || ask.order.takerAddress === "0x0000000000000000000000000000000000000000")

        if (isValidOrder) {
            filteredAsks.push(ask)
        }
    }

    return {
        bids: filteredBids,
        asks: filteredAsks
    }

}

export async function zeroXContractAddresses() {
    let chainId = await providerUtils.getChainIdAsync(getProvider())
    return getContractAddressesForChainOrThrow(chainId)
}

let bids = []
let asks = []

let orderBookInitialized = false

let tokenCouple = {
    baseToken: null,
    quoteToken: null
}

let relayClient = new HttpClient("https://api.0x.org/sra/v3")

let callbacksRegister = []
let baseTokenChangeRegister = []
