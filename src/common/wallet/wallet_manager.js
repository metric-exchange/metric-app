import {MetamaskSubprovider} from "@0x/subproviders";
import {providerUtils} from "@0x/utils";
import {ContractWrappers} from "@0x/contract-wrappers";
import {clearWalletProvider, connectToWallet, hasCashedProvider, trySwitchWallet, web3ModalPovider} from "./web3Modal";
import LogRocket from "logrocket";
import Web3 from "web3";

export let walletAddress = undefined

export function registerForWalletChanges(item) {
    walletEventListeners.push(item)
}

export function accountAddress() { return walletAddress }

export function isWalletConnected() {
    return (accountAddress() !== undefined)
}

export async function initWeb3() {

    window.web3fallback = new Web3(new Web3.providers.WebsocketProvider(defaultWSUrl))

    if (hasCashedProvider()) {
        await connectWallet();
    }
}

export async function connectWallet() {
    await connectToWallet()
    await updateAccount()
}

async function updateAccount() {
    const accounts = await window.web3Modal.eth.getAccounts()
    updateAccountAddress(accounts)

    if (web3ModalPovider !== undefined && web3ModalPovider !== null) {
        web3ModalPovider.on("accountsChanged", (accounts) => {
            updateAccountAddress(accounts);
        });

    }
}

export async function switchWallet() {
    await trySwitchWallet(updateAccount)
}

export function updateAccountAddress(accounts) {
    if (accounts !== undefined && accounts.length > 0) {
        walletAddress = accounts[0]
    } else if (walletAddress !== undefined){
        clearWalletProvider()
        walletAddress = undefined
    }
    LogRocket.identify(walletAddress)
    walletEventListeners.forEach(item => item.onWalletChanges())
}

export function getProvider() {
    if (providerEngine === null) {
        initProvider()
    }
    return providerEngine
}

function initProvider() {
    providerEngine = new MetamaskSubprovider(web3ModalPovider)
}

export async function getContractWrapper() {
    if (contractWrapper === null) {
        let chainId = await providerUtils.getChainIdAsync(getProvider())
        contractWrapper = new ContractWrappers(getProvider(), {
            chainId: chainId,
        });
    }

    return contractWrapper
}

let providerEngine = null
let contractWrapper = null
let walletEventListeners = []
let defaultWSUrl = "wss://mainnet.infura.io/ws/v3/12522e5176814bfda74dd672929641a3"
