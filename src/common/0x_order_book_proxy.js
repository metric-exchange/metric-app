import {HttpClient} from "@0x/connect";
import {getProvider} from "./wallet/wallet_manager";
import {BigNumber, providerUtils} from "@0x/utils";
import {isTokenAmountOverLimit, tokensList} from "./token_fetch";
import {getContractAddressesForChainOrThrow} from "@0x/contract-addresses";

export function registerForOrderBookUpdateEvents(object) {
    callbacksRegister.push(object)
}

export function registerForBaseTokenChange(object) {
    baseTokenChangeRegister.push(object)
}

export function getReplayClient() {
    return relayClient
}

export function getOrderBookBids(onlyValidOrders = true) {
    return bids.filter(o => !onlyValidOrders || o.is_valid).map(o => o.order)
}

export function getOrderBookAsks(onlyValidOrders = true) {
    return asks.filter(o => !onlyValidOrders || o.is_valid).map(o => o.order)
}

export async function synchronizeOrderBook() {

    if (tokenCouple.quoteToken !== null && tokenCouple.baseToken !== null) {
        await updateOrderBook()
    }

    setTimeout(synchronizeOrderBook, 10000)
}

export async function setBaseToken(token) {
    tokenCouple.baseToken = token
    bids=[]
    asks = []
    baseTokenChangeRegister.forEach(c => c.onBaseTokenUpdate())
}


export function setQuoteToken(token) {
    tokenCouple.quoteToken = token
}

export function getBaseToken() {
    return tokenCouple.baseToken
}

export function getQuoteToken() {
    return tokenCouple.quoteToken
}

export async function getBidsMatching(baseTokenAddress, quoteTokenAddress) {
    let orders = await getOrdersMatching(baseTokenAddress, quoteTokenAddress)
    return orders.bids.filter(o => o.is_valid).map(o => o.order)
}

async function updateOrderBook() {
    let baseToken = getBaseToken()
    let quoteToken = getQuoteToken()

    let orderBookUpdate =
        await getOrdersMatching(
            baseToken.address,
            quoteToken.address
        )

    if (baseToken.symbol === getBaseToken().symbol && quoteToken.symbol === getQuoteToken().symbol) {
        bids = orderBookUpdate.bids
        asks = orderBookUpdate.asks

        await Promise.all(
            callbacksRegister.map(obj => obj.onOrderBookUpdate())
        )
    }

}

async function getOrdersMatching(baseTokenAddress, quoteTokenAddress) {

    let baseToken = tokensList().find(t => t.address === baseTokenAddress)
    let quoteToken = tokensList().find(t => t.address === quoteTokenAddress)

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

    for(let b of orders.bids.records) {
        let takerAmount = new BigNumber(parseInt(b.metaData.remainingFillableTakerAssetAmount))
        let makerAmount =
            b.order.makerAssetAmount
                .multipliedBy(takerAmount)
                .dividedToIntegerBy(b.order.takerAssetAmount)

        let isValidOrder =
            b.order.takerAddress === "0x0000000000000000000000000000000000000000" &&
            isTokenAmountOverLimit(baseToken, takerAmount) &&
            isTokenAmountOverLimit(quoteToken, makerAmount)

        filteredBids.push(
            {
                order: b,
                is_valid: isValidOrder
            }
        )
    }

    for(let b of orders.asks.records) {
        let takerAmount = new BigNumber(parseInt(b.metaData.remainingFillableTakerAssetAmount))
        let makerAmount =
            b.order.makerAssetAmount
                .multipliedBy(takerAmount)
                .dividedToIntegerBy(b.order.takerAssetAmount)

        let isValidOrder =
            b.order.takerAddress === "0x0000000000000000000000000000000000000000" &&
            isTokenAmountOverLimit(quoteToken, takerAmount) &&
            isTokenAmountOverLimit(baseToken, makerAmount)

        filteredAsks.push(
            {
                order: b,
                is_valid: isValidOrder
            }
        )
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

let tokenCouple = {
    baseToken: null,
    quoteToken: null
}

let relayClient = new HttpClient("https://api.0x.org/sra/v3")

let callbacksRegister = []
let baseTokenChangeRegister = []
