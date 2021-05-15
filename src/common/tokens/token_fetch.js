import {
    accountAddress,
    ConnectedNetworkId,
    isWalletConnected
} from "../wallet/WalletManager";
import {Erc20Abi, Erc20ContractProxy} from "../Erc20ContractProxy";
import {fetchJson} from "../JsonApiFetch";
import {CustomTokenManager} from "./CustomsTokenManager";
import {Token} from "./token";
import Rollbar from "rollbar";
import {BigNumber} from "@0x/utils";
import {chainToken, getConnectedNetworkConfig} from "../ChainHelpers";

export function resetTokensInfo() {
    tokens.forEach(t => {
        t.balance = new BigNumber(NaN)
        t.allowance.ExchangeProxyV4Address = NaN
        balancesRegister.map(item => item.onTokenBalancesUpdate(t))
    })
}

export function registerForTokenListUpdate(item) {
    register.push(item)
}

export function registerForTokenListFilterUpdate(item) {
    filterRegister.push(item)
}

export function registerForTokenBalancesUpdate(item) {
    balancesRegister.push(item)
}

export function disableToken(symbol) {
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].symbol.toLowerCase() === symbol.toLowerCase()) {
            tokens[i].disabled = true
        }
    }
}

export async function findOrAddTokenWithAddress(address) {
    if (findTokenWithAddress(address) === undefined) {
        await addTokenWithAddress(address)
    }
    return findTokenWithAddress(address)
}

export function findTokenWithAddress(address) {
    return tokensList().find(t => t.address.toLowerCase() === address.toLowerCase())
}

export function tokensList() { return tokens }

export async function fetchTokensInfo(address) {
    console.debug("Token Balances/allowances update starting")
    await executeBatch(address, 0, 100, 500)
}

async function executeBatch(address, batchIndex, batchSize, throttleInterval) {
    if (batchIndex*batchSize < tokens.length) {
        try {
            let batch = new window.web3Modal.BatchRequest();
            for (let index = batchIndex*batchSize; index < Math.min((batchIndex+1)*batchSize, tokens.length); index++) {
                let token = tokens[index]
                if (token.address === chainToken().address) {
                    batch.add(
                        window.web3Modal.eth
                            .getBalance
                            .request(address, 'latest', (err, b) => updateBalance(token, address, b))
                    );
                }
                else {
                    let contract = new window.web3Modal.eth.Contract(Erc20Abi, token.address);
                    batch.add(
                        contract
                            .methods
                            .balanceOf(address)
                            .call
                            .request({from: address}, (err, b) => updateBalance(token, address, b))
                    );
                }
            }
            await batch.execute();
        } catch(e) {
            console.warn(`Unexpected error while updating tokens balance/allowance info ${e}`)
        }

        setTimeout(() => executeBatch(address, batchIndex+1, batchSize, throttleInterval), throttleInterval)
    } else {
        console.debug("Token Balances/allowances update finished")
    }
}

async function updateBalance(token, address, balance) {

    if (isWalletConnected() && address === accountAddress() && isNaN(balance) === false) {
        let newBalance = new BigNumber(balance).dividedBy(10 ** token.decimals)
        if (!newBalance.isEqualTo(token.balance)) {
            if (!isNaN(token.balance) || newBalance.isGreaterThan(0)) {
                console.debug(`update balance of ${token.symbol} to ${newBalance.toString()}`)
            }
            token.balance = newBalance
            await Promise.all(
                balancesRegister.map(item => item.onTokenBalancesUpdate(token))
            )
        }

        if (token.balance.isGreaterThan(0) && token.address !== chainToken().address) {
            await fetchAllowance(token, address, ExchangeProxyV4Address)
        } else {
            let allowance = token.address !== chainToken().address ? 0 : 1e27
            if (token.allowance[ExchangeProxyV4Address] !== allowance) {
                token.allowance[ExchangeProxyV4Address] = allowance
            }
        }

    }
}

async function fetchBalance(token, address) {
    let contract = Erc20ContractProxy.erc20Contract(address)
    let balance = await contract.methods.balanceOf(address).call()
    await updateBalance(token, address, balance)
}

async function fetchAllowance(token, address, target) {
    let contract = Erc20ContractProxy.erc20Contract(token.address)
    await contract
        .methods
        .allowance(address, target)
        .call(
            { from: address},
            async (error, allowance) => {
                if (error === null && isWalletConnected() && address === accountAddress()) {
                    await updateAllowance(token, target, allowance)
                } else {
                    console.error(`Failed to fetch allowance for: ${token.symbol}`)
                }
            }
        )
}

export async function updateAllowance(token, target, allowance) {
    if (isNaN(allowance) === false) {
        let newAllowance = allowance / (10 ** token.decimals)
        if (newAllowance !== token.allowance[target]) {
            console.debug(`update allowance to trade ${token.symbol} to ${newAllowance} for ${target}`)
            token.allowance[target] = newAllowance
        }
    }
}

export async function resetTokenList() {
    clearTokenList()
    tokens = initTokenList()
    await loadTokenList()
}

export function clearTokenList() {
    tokens = []
}

export async function loadTokenList()
{
    try {
        let url = "https://tokens.coingecko.com/uniswap/all.json"

        let connectedNetworkConfig = getConnectedNetworkConfig()
        if (connectedNetworkConfig !== undefined) {
            url = connectedNetworkConfig.uris.tokens
        }

        await fetchJson(url)
            .then(json => {
                if (json.tokens !== undefined) {
                    return Array.from(json.tokens)
                } else {
                    return []
                }
            })
            .then(at => {
                at.forEach(t => {
                    addToken({
                        balance: new BigNumber(NaN),
                        allowance: {
                            Erc20Proxy: NaN,
                            ExchangeProxyAllowanceTarget: NaN,
                            ExchangeProxyV4Address: NaN
                        },
                        address: t.address.toLowerCase(),
                        symbol: t.symbol,
                        decimals: t.decimals,
                        logoURI: t.logoURI,
                        hadHidingGame: false
                    })
                })
            })

        tokenListInitialized = true

        await triggerTokenListUpdateEvent()

    } catch (e) {
        console.error(`Token list fetch failed, search by address can still be used ${e}`)
    }
}

export async function triggerTokenListUpdateEvent() {
    await Promise.all(
        register.map(item => item.onTokenListUpdate())
    )
}

export async function triggerTokenListFilterUpdateEvent() {
    await Promise.all(
        filterRegister.map(item => item.onTokenListFilterUpdate())
    )
}

export function isTokenListInitialized() {
    return tokenListInitialized
}

export function addToken(token) {
    if (tokens.find(t => t.address.toLowerCase() === token.address.toLowerCase()) === undefined) {
        tokens.push(token)
    }
}

export async function addTokenWithAddress(address) {
    try {
        let token = { address: address.toLowerCase(), hadHidingGame: false }
        let contract = Erc20ContractProxy.erc20Contract(address)
        token.symbol = await contract.methods.symbol().call().then(s => s.toUpperCase())
        token.decimals = await contract.methods.decimals().call().then(s => parseInt(s))
        token.balance = new BigNumber(NaN)
        token.allowance = {
            ExchangeProxyV4Address: NaN
        }

        customTokensManager.addToken(new Token(token.symbol, token.address, token.decimals))

        addToken(token)

        await notifyTokenListRegisteredObjects()

        if (isWalletConnected()) {
            await fetchBalance(token, address)
        }

    } catch (e) {
        console.info(`Invalid token address: ${address} ${e}`)
    }
}

export async function notifyTokenListRegisteredObjects() {
    await Promise.all(
        register.map(item => item.onTokenListUpdate())
    )
}

function initTokenList() {
    let tokens = []
    let defaults = getConnectedNetworkConfig()
    if (defaults !== undefined) {
        tokens = defaults.defaultTokens
    }
    customTokensManager.init()

    let chainInfo = customTokensManager.customtokens.chains.find(n => n.id === ConnectedNetworkId)
    if (chainInfo !== undefined) {
        chainInfo.tokens.forEach(t => {
            tokens.push({
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyV4Address: NaN
                },
                address: t.address.toLowerCase(),
                symbol: t.symbol,
                decimals: t.decimals,
                logoURI: t.logoURI,
                hadHidingGame: false
            })
        })
    }

    return tokens
}

let customTokensManager = new CustomTokenManager()

let tokens = []
let register = []
let filterRegister = []
let balancesRegister = []
let tokenListInitialized = false

export let METRIC_TOKEN_ADDRESS = "0xEfc1C73A3D8728Dc4Cf2A18ac5705FE93E5914AC"

export let ExchangeProxyV4Address = "0xdef1c0ded9bec7f1a1670819833240f027b25eff"