import EthIcon from './eth.png'
import HypeIcon from './hype.png'
import {accountAddress, isWalletConnected} from "./wallet/wallet_manager";
import {Erc20Abi, Erc20ContractProxy} from "./erc20_contract_proxy";
import {fetchJson} from "./json_api_fetch";
import {CustomTokenManager} from "./tokens/CustomsTokenManager";
import {Token} from "./tokens/token";
import {zeroXContractAddresses} from "./0x_order_book_proxy";


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
    let token = findTokenWithAddress(address)
    if (token === undefined) {
        await addTokenWithAddress(address)
    }
    return findTokenWithAddress(address)
}

export function findTokenWithAddress(address) {
    return tokensList().find(t => t.address.toLowerCase().startsWith(address.toLowerCase()))
}

export function tokensList() { return tokens }

export function updateTokenAllowance(address, allowance) {
    let token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase())
    token.allowance = formatAmount(allowance / (10 ** token.decimals))
}

export async function fetchTokensInfo() {
    await executeBatch(0)
}

async function executeBatch(batchIndex) {
    if (isWalletConnected() && batchIndex*100 < tokens.length) {
        let zeroXAllowanceTargetAddress = await zeroXContractAddresses().then(a => a.erc20Proxy)
        let batch = new window.web3.BatchRequest();
        for (let index = batchIndex*100; index < Math.min((batchIndex+1)*100, tokens.length); index++) {
            let token = tokens[index]
            let contract = new window.web3.eth.Contract(Erc20Abi, token.address);
            batch.add(
                contract
                    .methods
                    .balanceOf(accountAddress())
                    .call
                    .request({from: accountAddress()}, (err, b) => updateBalance(index, b))
            );
            batch.add(
                contract
                    .methods
                    .allowance(accountAddress(), zeroXAllowanceTargetAddress)
                    .call
                    .request({from: accountAddress()}, (err, b) => updateAllowance(index, b))
            );
        }
        await batch.execute();

        setTimeout(() => executeBatch(batchIndex+1), 10000)
    } else {
        setTimeout(() => executeBatch(0), 60000)
    }
}

async function updateBalance(index, balance) {
    if (isNaN(balance) === false) {
        let newBalance = balance / (10 ** tokens[index].decimals)
        if (newBalance !== tokens[index].balance) {
            console.log("update balance", tokens[index].symbol, newBalance)
            tokens[index].balance = newBalance
            await Promise.all(
                balancesRegister.map(item => item.onTokenBalancesUpdate())
            )
        }
    }
}

async function updateAllowance(index, allowance) {
    if (isNaN(allowance) === false) {
        let newAllowance = allowance / (10 ** tokens[index].decimals)
        if (newAllowance !== tokens[index].allowance) {
            console.log("update allowance", tokens[index].symbol, newAllowance)
            tokens[index].allowance = newAllowance
            await Promise.all(
                allowancesRegister.map(item => item.onTokenAllowancesUpdate())
            )
        }
    }
}

function formatAmount(amount) {
    return isNaN(amount) ? 0 : amount
}

export async function loadTokenList()
{
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
                    balance: 0,
                    allowance: 0,
                    address: t.address,
                    symbol: t.symbol,
                    decimals: t.decimals,
                    logoURI: t.logoURI,
                    volume_limit: -1
                })
            })
        })

    await Promise.all(
        register.map(item => item.onTokenListUpdate())
    )
}

export function isTokenAmountOverLimit(token, amount) {
    return amount.isGreaterThan(token.volume_limit * (10 ** token.decimals))
}

export function addToken(token) {
    if (tokens.find(t => t.symbol === token.symbol) === undefined) {
        tokens.push(token)
    }
}

export async function addTokenWithAddress(address) {
    try {
        let token = { address: address }
        let contract = Erc20ContractProxy.erc20Contract(address)
        token.symbol = await contract.methods.symbol().call().then(s => s.toUpperCase())
        token.decimals = await contract.methods.decimals().call().then(s => parseInt(s))
        token.balance = 0
        token.allowance = 0
        token.volume_limit = -1

        customTokensManager.addToken(new Token(token.symbol, token.address, token.decimals))

        addToken(token)

        register.map(item => item.onTokenListUpdate())

    } catch (e) {
        console.log(e.message)
        console.log("Invalid token address:", address)
    }
}

function initTokenList() {
    let tokens = defaultTokens
    customTokensManager.init()
    customTokensManager.customtokens.tokens.forEach(t => {
        tokens.push({
            balance: t.balance,
            allowance: 0,
            address: t.address,
            symbol: t.symbol,
            decimals: t.decimals,
            logoURI: t.logoURI,
            volume_limit: -1
        })
    })

    return tokens
}
let defaultTokens = [
    {
        address: "0x6e36556b3ee5aa28def2a8ec3dae30ec2b208739",
        decimals: 18,
        symbol: "BUILD",
        logoURI: "https://etherscan.io/token/images/build_32.png",
        balance: 0,
        allowance: 0,
        volume_limit: -1,
        disabled: false
    },
    {
        address: "0xEfc1C73A3D8728Dc4Cf2A18ac5705FE93E5914AC",
        decimals: 18,
        symbol: "METRIC",
        logoURI: "https://etherscan.io/token/images/metric_32.png",
        balance: 0,
        allowance: 0,
        volume_limit: -1,
        disabled: false
    },
    {
        address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        decimals: 18,
        logoURI: EthIcon,
        balance: 0,
        allowance: 0,
        volume_limit: -1,
        disabled: false
    },
    {
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        decimals: 18,
        symbol: "DAI",
        logoURI: "https://etherscan.io/token/images/MCDDai_32.png",
        balance: 0,
        allowance: 0,
        volume_limit: 10,
        disabled: false
    },
    {
        address: "0xe1212f852c0ca3491ca6b96081ac3cf40e989094",
        decimals: 18,
        symbol: "HYPE",
        logoURI: HypeIcon,
        balance: 0,
        allowance: 0,
        volume_limit: -1,
        disabled: false
    }
]
let customTokensManager = new CustomTokenManager()

let tokens = initTokenList()
let register = []
let balancesRegister = []
let allowancesRegister = []

