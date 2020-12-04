import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

export let web3ModalPovider = undefined
let infuraId = "12522e5176814bfda74dd672929641a3";

export async function connectToWallet() {
    web3ModalPovider = await web3Modal.connect();
    window.web3 = new Web3(web3ModalPovider);
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
    cacheProvider: false,
    providerOptions
});
