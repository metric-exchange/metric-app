import {BinanceChainNetworkId, EthereumNetworkId, PolygonNetworkId, SupportedNetworks} from "./constants";
import {ConnectedNetworkId} from "./wallet/WalletManager";
import {web3ModalProvider} from "./wallet/Web3Modal";


export function getConnectedNetworkConfig() {
    return SupportedNetworks.find(n => n.id === ConnectedNetworkId)
}

export function isConnectedToEthereumMainNet() {
    return ConnectedNetworkId === EthereumNetworkId
}

export function isConnectedToBscMainNet() {
    return ConnectedNetworkId === BinanceChainNetworkId
}

export function isConnectedToPolygonMainNet() {
    return ConnectedNetworkId === PolygonNetworkId
}

export function isSupportedNetwork() {
    return ConnectedNetworkId === EthereumNetworkId
        || ConnectedNetworkId === BinanceChainNetworkId
        || ConnectedNetworkId === PolygonNetworkId
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

export async function addChain(config) {
    await web3ModalProvider.request({method: 'wallet_addEthereumChain', params:[config]})
}

export function isStakingEnabled() {
    let chain = getConnectedNetworkConfig()
    return chain.staking !== undefined
}

export function metricShareContract() {
    let chain = getConnectedNetworkConfig()

    if (!chain.staking) {
        return undefined
    }

    return chain.staking.metricShare
}

export function metricShareVaultContract() {
    let chain = getConnectedNetworkConfig()

    if (!chain.staking) {
        return undefined
    }

    return chain.staking.metricShareVault
}

export function metricLpToken() {
    let chain = getConnectedNetworkConfig()
    return chain.staking.metricLp
}

export function metricToken() {
    let chain = getConnectedNetworkConfig()
    return chain.staking.metric
}