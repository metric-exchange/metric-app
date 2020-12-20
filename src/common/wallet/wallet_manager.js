import {MetamaskSubprovider} from "@0x/subproviders";
import {providerUtils} from "@0x/utils";
import {ContractWrappers} from "@0x/contract-wrappers";
import {clearWalletProvider, connectToWallet, hasCashedProvider, trySwitchWallet, web3ModalPovider} from "./web3Modal";

export let walletAddress = undefined

export function registerForWalletChanges(item) {
    walletEventListeners.push(item)
}

export function accountAddress() { return walletAddress }

export function isWalletConnected() {
    return (accountAddress() !== undefined)
}

export async function initWeb3() {
    if (hasCashedProvider()) {
        await connectWallet();
    }
}

export async function connectWallet() {
    await connectToWallet()
    await updateAccount()
}

async function updateAccount() {
    const accounts = await window.web3.eth.getAccounts()
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