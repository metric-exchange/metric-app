import EthIcon from './eth.png'
import HypeIcon from './hype.png'
import UpdownIcon from './updown.jpg'
import {accountAddress, isWalletConnected} from "../wallet/wallet_manager";
import {Erc20Abi, Erc20ContractProxy} from "../erc20_contract_proxy";
import {fetchJson} from "../json_api_fetch";
import {CustomTokenManager} from "./CustomsTokenManager";
import {Token} from "./token";
import {zeroXContractAddresses} from "../0x/0x_order_book_proxy";

export function resetTokensInfo() {
    tokens.forEach(t => {
        t.balance = 0
        t.allowance = 0
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

export async function fetchTokensInfo(address) {
    await executeBatch(address, 0, 100, 1000)
}

async function executeBatch(address, batchIndex, batchSize, throttleInterval) {
    if (isWalletConnected() && address === accountAddress()) {
        if (batchIndex*batchSize < tokens.length) {
            let zeroXAllowanceTargetAddress = await zeroXContractAddresses().then(a => a.erc20Proxy)
            let batch = new window.web3.BatchRequest();
            for (let index = batchIndex*batchSize; index < Math.min((batchIndex+1)*batchSize, tokens.length); index++) {
                let token = tokens[index]
                let contract = new window.web3.eth.Contract(Erc20Abi, token.address);
                batch.add(
                    contract
                        .methods
                        .balanceOf(address)
                        .call
                        .request({from: address}, (err, b) => updateBalance(index, address, b))
                );
            }
            await batch.execute();

            setTimeout(() => executeBatch(address, batchIndex+1, batchSize, throttleInterval), throttleInterval)
        } else {
            setTimeout(() => executeBatch(address, 0, batchSize, 10000), 60000)
        }
    }
}

async function updateBalance(index, address, balance) {
    if (isWalletConnected() && address === accountAddress() && isNaN(balance) === false) {
        let newBalance = balance / (10 ** tokens[index].decimals)
        if (newBalance !== tokens[index].balance) {
            console.debug("update balance", tokens[index].symbol, newBalance)
            tokens[index].balance = newBalance
            await Promise.all(
                balancesRegister.map(item => item.onTokenBalancesUpdate())
            )
        }
        if (newBalance > 0) {
            let zeroXAllowanceTargetAddress = await zeroXContractAddresses().then(a => a.erc20Proxy)
            let contract = new window.web3.eth.Contract(Erc20Abi, tokens[index].address);
            let allowance = await contract
                .methods
                .allowance(address, zeroXAllowanceTargetAddress)
                .call()
            await updateAllowance(index, address, allowance)
        }
    }
}

async function updateAllowance(index, address, allowance) {
    if (isWalletConnected() && address === accountAddress() && isNaN(allowance) === false) {
        let newAllowance = allowance / (10 ** tokens[index].decimals)
        if (newAllowance !== tokens[index].allowance) {
            console.debug("update allowance", tokens[index].symbol, newAllowance)
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
                    logoURI: t.logoURI
                })
            })
        })

    await Promise.all(
        register.map(item => item.onTokenListUpdate())
    )
}

export function addToken(token) {
    if (tokens.find(t => t.address.toLowerCase() === token.address.toLowerCase()) === undefined) {
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

        customTokensManager.addToken(new Token(token.symbol, token.address, token.decimals))

        addToken(token)

        register.map(item => item.onTokenListUpdate())

    } catch (e) {
        console.error("Invalid token address:", address)
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
            logoURI: t.logoURI
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
        disabled: false
    },
    {
        address: "0xEfc1C73A3D8728Dc4Cf2A18ac5705FE93E5914AC",
        decimals: 18,
        symbol: "METRIC",
        logoURI: "https://etherscan.io/token/images/metric_32.png",
        balance: 0,
        allowance: 0,
        disabled: false
    },
    {
        address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        decimals: 18,
        logoURI: EthIcon,
        balance: 0,
        allowance: 0,
        disabled: false
    },
    {
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        decimals: 18,
        symbol: "DAI",
        logoURI: "https://etherscan.io/token/images/MCDDai_32.png",
        balance: 0,
        allowance: 0,
        disabled: false
    },
    {
        address: "0xe1212f852c0ca3491ca6b96081ac3cf40e989094",
        decimals: 18,
        symbol: "HYPE",
        logoURI: HypeIcon,
        balance: 0,
        allowance: 0,
        disabled: false
    },
    {
        address: "0xb7412e57767ec30a76a4461d408d78b36688409c",
        decimals: 18,
        symbol: "bCRED",
        logoURI: "https://",
        balance: 0,
        allowance: 0,
        disabled: false
    },
    {
        address: "0xfbfaf8d8e5d82e87b80578fd348f60fb664e9390",
        decimals: 18,
        symbol: "UPDOWN",
        logoURI: UpdownIcon,
        balance: 0,
        allowance: 0,
        disabled: false
    }
]
let customTokensManager = new CustomTokenManager()

let tokens = initTokenList()
let register = []
let balancesRegister = []
let allowancesRegister = []

