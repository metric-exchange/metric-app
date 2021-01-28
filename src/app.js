import "@babel/polyfill";
import '@riotjs/hot-reload'
import { component, install } from 'riot'
import jquery from "jquery";
import { addToken } from "./common/tokens/token_fetch";
import { accountAddress, connectWallet, switchWallet, updateAccountAddress, isWalletConnected } from './common/wallet/wallet_manager'
import { isDarkThemeSet, isLightThemeSet, initTheme } from './common/theme_manager'

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

Rollbar.debug(`Environment: ${process.env.NODE_ENV}`)

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

})

component(Main)(document.getElementById('app'), {})
