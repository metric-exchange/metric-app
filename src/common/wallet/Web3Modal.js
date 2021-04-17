import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

export let web3ModalProvider = undefined
let infuraId = "12522e5176814bfda74dd672929641a3";

export async function connectToWallet() {
    web3ModalProvider = await web3Modal.connect();
    window.web3Modal = new Web3(web3ModalProvider);
}

export function clearWalletProvider() {
    web3Modal.clearCachedProvider();
}

export async function trySwitchWallet(onSuccess) {
    let oldProvider = web3Modal.cachedProvider
    web3Modal.clearCachedProvider();
    try {
        await connectToWallet()
        await onSuccess()
    } catch (e) {
        web3Modal.setCachedProvider(oldProvider)
    }
}

export function hasCashedProvider() {
    return web3Modal.cachedProvider !== ''
}

const providerOptions = {
    walletconnect: {
        package: WalletConnectProvider,
        options: {
            infuraId: infuraId,
        }
    }
};

const web3Modal = new Web3Modal({
    network: "mainnet",
    cacheProvider: true,
    providerOptions
});
