import {MetamaskSubprovider} from "@0x/subproviders";
import {providerUtils} from "@0x/utils";
import {ContractWrappers} from "@0x/contract-wrappers";
import {clearWalletProvider, connectToWallet, hasCashedProvider, trySwitchWallet, web3ModalProvider} from "./web3Modal";
import LogRocket from "logrocket";
import * as Rollbar from "rollbar";
import ENS, { getEnsAddress } from '@ensdomains/ensjs'
import {EthereumNetworkId, SupportedNetworks} from "../constants";

export let walletAddress = undefined

export async function walletOwnerEnsName(address) {
    const ens = new ENS({ provider: web3ModalProvider, ensAddress: getEnsAddress('1') })
    let name = await ens.getName(address)
    let reverseAddress = await ens.name(name.name).getAddress()

    if(address.toLowerCase() !== reverseAddress.toLowerCase()) {
        return null;
    }
    return name.name
}

export async function tryFormatWalletName(address) {
    let name = null

    if (isWalletConnected()) {
        name = await walletOwnerEnsName(address)
    }

    if (name === null) {
        name = obfuscateAddress(address)
    }

    return name
}

export function obfuscateAddress(address) {
    return address.substr(0, 4) + '...' + address.substr(38, 40)
}

export function registerForWalletChanges(item) {
    walletEventListeners.push(item)
}

export function registerForNetworkChanges(item) {
    networkEventListeners.push(item)
}

export function accountAddress() { return walletAddress }

export function isWalletConnected() {
    return (accountAddress() !== undefined)
}

export async function initWeb3() {
    if (hasCashedProvider()) {
        await connectWallet(false);
    }
}

export async function connectWallet(detectNetworkChange = true) {
    let oldConnectedNetwork = ConnectedNetworkId
    await connectToWallet()
    await updateAccount()

    if (detectNetworkChange && oldConnectedNetwork !== ConnectedNetworkId) {
        networkEventListeners.forEach(item => item.onNetworkChanges())
    }
}

async function updateAccount() {
    const accounts = await window.web3Modal.eth.getAccounts()
    ConnectedNetworkId = await window.web3Modal.eth.getChainId()

    updateAccountAddress(accounts)

    if (web3ModalProvider !== undefined && web3ModalProvider !== null) {

        web3ModalProvider.on("accountsChanged", (accounts) => {
            updateAccountAddress(accounts);
        });

        web3ModalProvider.on("chainChanged", (networkId) => {
            ConnectedNetworkId = parseInt(networkId)
            networkEventListeners.forEach(item => item.onNetworkChanges())
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
    //LogRocket.identify(walletAddress)
    Rollbar.configure({
        payload: {
            person: {
                id: walletAddress
            }
        }
    });
    walletEventListeners.forEach(item => item.onWalletChanges())
}

export function getProvider() {
    if (providerEngine === null) {
        initProvider()
    }
    return providerEngine
}

function initProvider() {
    providerEngine = new MetamaskSubprovider(web3ModalProvider)
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
let networkEventListeners = []
export let ConnectedNetworkId = EthereumNetworkId

