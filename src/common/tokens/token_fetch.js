import EthIcon from './eth.png'
import HypeIcon from './hype.png'
import UpdownIcon from './updown.jpg'
import GoldIcon from './gold.png'
import {accountAddress, isWalletConnected} from "../wallet/wallet_manager";
import {Erc20Abi, Erc20ContractProxy} from "../erc20_contract_proxy";
import {fetchJson} from "../json_api_fetch";
import {CustomTokenManager} from "./CustomsTokenManager";
import {Token} from "./token";
import Rollbar from "rollbar";
import {BigNumber} from "@0x/utils";

export function resetTokensInfo() {
    tokens.forEach(t => {
        t.balance = new BigNumber(NaN)
        t.allowance.ExchangeProxyAllowanceTarget = NaN
        t.allowance.Erc20Proxy = NaN
        t.allowance.ExchangeProxyV4Address = NaN
    })
}

export function registerForTokenListUpdate(item) {
    register.push(item)
}

export function registerForTokenBalancesUpdate(item) {
    balancesRegister.push(item)
}

export function registerForTokenAllowancesUpdate(item) {
    allowancesRegister.push(item)
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
    await executeBatch(address, 0, 100, 500)
}

async function executeBatch(address, batchIndex, batchSize, throttleInterval) {
    if (isWalletConnected() && address === accountAddress()) {
        if (batchIndex*batchSize < tokens.length) {
            try {
                let batch = new window.web3Modal.BatchRequest();
                for (let index = batchIndex*batchSize; index < Math.min((batchIndex+1)*batchSize, tokens.length); index++) {
                    let token = tokens[index]
                    if (token.symbol === "ETH" && isNaN(token.balance)) {
                        batch.add(
                            window.web3Modal.eth
                                .getBalance
                                .request(address, 'latest', (err, b) => updateBalance(token, address, b))
                        );
                    }
                    else if (isNaN(token.balance) || isNaN(token.allowance[Erc20ProxyAddress]) || isNaN(token.allowance[ExchangeProxyAllowanceTargetAddress])) {
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
                Rollbar.warn(`Unexpected error while updating tokens balance/allowance info ${e}`)
            }

            setTimeout(() => executeBatch(address, batchIndex+1, batchSize, throttleInterval), throttleInterval)
        } else {
            Rollbar.debug("Token Balances/allowances startup update finished")
            if (tokensList().find(t => isNaN(t.balance) || isNaN(t.allowance[Erc20ProxyAddress]) || isNaN(t.allowance[ExchangeProxyAllowanceTargetAddress]))) {
                setTimeout(() => fetchTokensInfo(address), 1000)
            }
        }
    }
}

async function updateBalance(token, address, balance) {

    if (isWalletConnected() && address === accountAddress() && isNaN(balance) === false) {
        let newBalance = new BigNumber(balance).dividedBy(10 ** token.decimals)
        if (newBalance.isGreaterThan(0)) {
            Rollbar.debug(`update balance of ${token.symbol} to ${newBalance.toString()}`)
        }

        token.balance = newBalance

        await Promise.all(
            balancesRegister.map(item => item.onTokenBalancesUpdate(token))
        )

        if (token.balance.isGreaterThan(0) && token.symbol !== "ETH") {
            await Promise.all(
                [
                    fetchAllowance(token, address, Erc20ProxyAddress),
                    fetchAllowance(token, address, ExchangeProxyAllowanceTargetAddress),
                    fetchAllowance(token, address, ExchangeProxyV4Address)
                ]
            )
        } else {
            let allowance = token.symbol !== "ETH" ? 0 : 1e27
            token.allowance[Erc20ProxyAddress] = allowance
            token.allowance[ExchangeProxyAllowanceTargetAddress] = allowance
            token.allowance[ExchangeProxyV4Address] = allowance
            await Promise.all(
                allowancesRegister.map(item => item.onTokenAllowancesUpdate(token))
            )
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
                    Rollbar.error(`Failed to fetch allowance for: ${token.symbol}`)
                }
            }
        )
}

export async function updateAllowance(token, target, allowance) {
    if (isNaN(allowance) === false) {
        let newAllowance = allowance / (10 ** token.decimals)
        if (newAllowance > 0) {
            Rollbar.debug(`update allowance to trade ${token.symbol} to ${newAllowance} for ${target}`)
        }
        token.allowance[target] = newAllowance
        await Promise.all(
            allowancesRegister.map(item => item.onTokenAllowancesUpdate(token))
        )
    }
}

export async function loadTokenList()
{
    try {
        await fetchJson("https://tokens.coingecko.com/uniswap/all.json")
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
                        address: t.address,
                        symbol: t.symbol,
                        decimals: t.decimals,
                        logoURI: t.logoURI
                    })
                })
            })

        tokenListInitialized = true

        await Promise.all(
            register.map(item => item.onTokenListUpdate())
        )
    } catch (e) {
        Rollbar.error(`Token list fetch failed, search by address can still be used ${e}`)
    }
}

export function isTokenListInitialized() {
    return tokenListInitialized
}

export function addToken(token) {
    if (token.symbol.toUpperCase() !== "ETH" &&
        tokens.find(t => t.address.toLowerCase() === token.address.toLowerCase()) === undefined) {
        tokens.push(token)
    }
}

export async function addTokenWithAddress(address) {
    try {
        let token = { address: address }
        let contract = Erc20ContractProxy.erc20FallbackContract(address)
        token.symbol = await contract.methods.symbol().call().then(s => s.toUpperCase())
        token.decimals = await contract.methods.decimals().call().then(s => parseInt(s))
        token.balance = new BigNumber(NaN)
        token.allowance = {
            Erc20Proxy: NaN,
            ExchangeProxyAllowanceTarget: NaN,
            ExchangeProxyV4Address: NaN
        }

        customTokensManager.addToken(new Token(token.symbol, token.address, token.decimals))

        addToken(token)

        await Promise.all(
            register.map(item => item.onTokenListUpdate())
        )

        if (isWalletConnected()) {
            await fetchBalance(token, address)
        }

    } catch (e) {
        Rollbar.info(`Invalid token address: ${address} ${e}`)
    }
}

function initTokenList() {
    let tokens = defaultTokens
    customTokensManager.init()
    customTokensManager.customtokens.tokens.forEach(t => {
        tokens.push({
            balance: new BigNumber(NaN),
            allowance: {
                Erc20Proxy: NaN,
                ExchangeProxyAllowanceTarget: NaN,
                ExchangeProxyV4Address: NaN
            },
            address: t.address,
            symbol: t.symbol,
            decimals: t.decimals,
            logoURI: t.logoURI
        })
    })

    return tokens
}

let defaultTokens = [
    {
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        decimals: 18,
        symbol: "ETH",
        logoURI: EthIcon,
        balance: new BigNumber(NaN),
        allowance: {
            ExchangeProxyAllowanceTarget : NaN,
            Erc20Proxy : NaN,
            ExchangeProxyV4Address: NaN
        },
        disabled: false
    },
    {
        address: "0x6e36556b3ee5aa28def2a8ec3dae30ec2b208739",
        decimals: 18,
        symbol: "BUILD",
        logoURI: "https://etherscan.io/token/images/build_32.png",
        balance: new BigNumber(NaN),
        allowance: {
            ExchangeProxyAllowanceTarget : NaN,
            Erc20Proxy : NaN,
            ExchangeProxyV4Address: NaN
        },
        disabled: false
    },
    {
        address: "0xEfc1C73A3D8728Dc4Cf2A18ac5705FE93E5914AC",
        decimals: 18,
        symbol: "METRIC",
        logoURI: "https://etherscan.io/token/images/metric_32.png",
        balance: new BigNumber(NaN),
        allowance: {
            ExchangeProxyAllowanceTarget : NaN,
            Erc20Proxy : NaN,
            ExchangeProxyV4Address: NaN
        },
        disabled: false
    },
    {
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        decimals: 18,
        symbol: "DAI",
        logoURI: "https://etherscan.io/token/images/MCDDai_32.png",
        balance: new BigNumber(NaN),
        allowance: {
            ExchangeProxyAllowanceTarget : NaN,
            Erc20Proxy : NaN,
            ExchangeProxyV4Address: NaN
        },
        disabled: false
    },
    {
        address: "0xe1212f852c0ca3491ca6b96081ac3cf40e989094",
        decimals: 18,
        symbol: "HYPE",
        logoURI: HypeIcon,
        balance: new BigNumber(NaN),
        allowance: {
            ExchangeProxyAllowanceTarget : NaN,
            Erc20Proxy : NaN,
            ExchangeProxyV4Address: NaN
        },
        disabled: false
    },
    {
        address: "0xb7412e57767ec30a76a4461d408d78b36688409c",
        decimals: 18,
        symbol: "bCRED",
        balance: new BigNumber(NaN),
        allowance: {
            ExchangeProxyAllowanceTarget : NaN,
            Erc20Proxy : NaN
        },
        disabled: false
    },
    {
        address: "0xfbfaf8d8e5d82e87b80578fd348f60fb664e9390",
        decimals: 18,
        symbol: "UPDOWN",
        logoURI: UpdownIcon,
        balance: new BigNumber(NaN),
        allowance: {
            ExchangeProxyAllowanceTarget : NaN,
            Erc20Proxy : NaN,
            ExchangeProxyV4Address: NaN
        },
        disabled: false
    },
    {
        address: "0xb34ab2f65c6e4f764ffe740ab83f982021faed6d",
        decimals: 18,
        symbol: "BSG",
        logoURI: GoldIcon,
        balance: new BigNumber(NaN),
        allowance: {
            ExchangeProxyAllowanceTarget : NaN,
            Erc20Proxy : NaN,
            ExchangeProxyV4Address: NaN
        },
        disabled: false
    },
    {
        address: "0xa9d232cc381715ae791417b624d7c4509d2c28db",
        decimals: 18,
        symbol: "BSGS",
        balance: new BigNumber(NaN),
        allowance: {
            ExchangeProxyAllowanceTarget : NaN,
            Erc20Proxy : NaN,
            ExchangeProxyV4Address: NaN
        },
        disabled: false
    },
    {
        address: "0x940c7ccd1456b29a6f209b641fb0edaa96a15c2d",
        decimals: 18,
        symbol: "BSGB",
        balance: new BigNumber(NaN),
        allowance: {
            ExchangeProxyAllowanceTarget : NaN,
            Erc20Proxy : NaN,
            ExchangeProxyV4Address: NaN
        },
        disabled: false
    }

]
let customTokensManager = new CustomTokenManager()

let tokens = initTokenList()
let register = []
let balancesRegister = []
let allowancesRegister = []
let tokenListInitialized = false

export let METRIC_TOKEN_ADDRESS = "0xEfc1C73A3D8728Dc4Cf2A18ac5705FE93E5914AC"
export let DAI_TOKEN_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F"

export let ExchangeProxyAllowanceTargetAddress = "0xf740b67da229f2f10bcbd38a7979992fcc71b8eb"
export let Erc20ProxyAddress = "0x95e6f48254609a6ee006f7d493c8e5fb97094cef"
export let ExchangeProxyV4Address = "0xdef1c0ded9bec7f1a1670819833240f027b25eff"
