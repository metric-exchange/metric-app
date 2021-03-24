import {BinanceChainNetworkId, EthereumNetworkId, SupportedNetworks} from "./constants";
import {ConnectedNetworkId} from "./wallet/WalletManager";


export function getConnectedNetworkConfig() {
    return SupportedNetworks.find(n => n.id === ConnectedNetworkId)
}

export function isConnectedToEthereumMainNet() {
    return ConnectedNetworkId === EthereumNetworkId
}

export function isConnectedToBscMainNet() {
    return ConnectedNetworkId === BinanceChainNetworkId
}

export function isSupportedNetwork() {
    return ConnectedNetworkId === EthereumNetworkId || ConnectedNetworkId === BinanceChainNetworkId
}

export function chainToken() {
    let chain = getConnectedNetworkConfig()
    return chain.defaultTokens.find(t => t.chainToken)
}

export function wrappedChainToken() {
    let chain = getConnectedNetworkConfig()
    return chain.defaultTokens.find(t => t.wrappedChainToken)
}

export function isWrapping(sellToken, buToken) {
    return sellToken.address === chainToken().address && buToken.address === wrappedChainToken().address
}

export function isUnwrapping(sellToken, buToken) {
    return sellToken.address === wrappedChainToken().address && buToken.address === chainToken().address
}