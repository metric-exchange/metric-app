import "core-js/stable";
import "regenerator-runtime/runtime";
import '@riotjs/hot-reload'
import { component, install } from 'riot'
import jquery from "jquery";
import { addToken } from "./common/tokens/token_fetch";
import {
    accountAddress,
    connectWallet,
    switchWallet,
    updateAccountAddress,
    isWalletConnected, obfuscateAddress
} from './common/wallet/WalletManager'
import { isDarkThemeSet, isLightThemeSet, initTheme } from './common/ThemeManager'

export default (window.$ = window.jQuery = jquery);

import Main from './components/main/index.riot'
import i18next from "i18next";
import {formatNumber} from "./common/helpers";
import {supportedLanguages} from "./common/localization/localize";

import LogRocket from 'logrocket';
/*
if (process.env.NODE_ENV === 'production') {
    LogRocket.init('5xh2hd/metric', {
        shouldCaptureIP: false
    });
}
*/

import * as Rollbar from "rollbar";
import {
    isConnectedToAvalancheMainnet,
    isConnectedToBscMainNet,
    isConnectedToEthereumMainNet,
    isConnectedToPolygonMainNet,
    isConnectedToCeloMainnet,
    isStakingEnabled,
    isSupportedNetwork,
    metricLpToken,
    metricShareContract,
    metricShareVaultContract,
    metricShareVaultV0Contract,
    metricToken,
    isConnectedToFantomMainnet,
    isLimitOrderSupported,
    addMetricLiquidityLink,
    metricLpSymbol
} from "./common/ChainHelpers";
Rollbar.init(
    {
        accessToken: "b317442394e7414b92fabd9608992313",
        captureUncaught: true,
        captureUnhandledRejections: true,
        payload: {
            enabled: true,
            captureIp: 'anonymize',
            environment: process.env.NODE_ENV
        }
    }
)

Rollbar.configure({
    verbose: process.env.NODE_ENV !== 'production'
});

console.info(`Environment: ${process.env.NODE_ENV}`)

install(c => {

    c.round = function(num, decimals) {
        return +(Math.round(num + `e+${decimals}`) + `e-${decimals}`)
    }

    c.accountAddress = accountAddress
    c.connectWallet = connectWallet
    c.switchWallet = switchWallet
    c.updateAccountAddress = updateAccountAddress

    c.addToken = addToken
    c.isWalletConnected = isWalletConnected

    c.isDarkThemeSet = isDarkThemeSet
    c.isLightThemeSet = isLightThemeSet
    c.initTheme = initTheme

    c.i18next = i18next
    c.formatNumber = formatNumber
    c.supportedLanguages = supportedLanguages

    c.isConnectedToEthereumMainNet = isConnectedToEthereumMainNet
    c.isLimitOrderSupported = isLimitOrderSupported
    c.isConnectedToBscMainNet = isConnectedToBscMainNet
    c.isConnectedToPolygonMainNet = isConnectedToPolygonMainNet
    c.isConnectedToAvalancheMainnet = isConnectedToAvalancheMainnet
    c.isConnectedToCeloMainnet = isConnectedToCeloMainnet
    c.isConnectedToFantomMainnet = isConnectedToFantomMainnet
    c.isSupportedNetwork = isSupportedNetwork
    c.isStakingEnabled = isStakingEnabled
    c.metricShareContract = metricShareContract
    c.metricShareVaultContract = metricShareVaultContract
    c.metricShareVaultV0Contract = metricShareVaultV0Contract
    c.metricLpToken = metricLpToken
    c.metricToken = metricToken
    c.addMetricLiquidityLink = addMetricLiquidityLink
    c.metricLpSymbol = metricLpSymbol

    c.obfuscateAddress = obfuscateAddress

})

component(Main)(document.getElementById('app'), {})
