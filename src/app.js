import "@babel/polyfill";
import '@riotjs/hot-reload'
import { component, install } from 'riot'
import jquery from "jquery";
import { addToken } from "./common/tokens/token_fetch";
import { accountAddress, connectWallet, switchWallet, updateAccountAddress, isWalletConnected } from './common/wallet/wallet_manager'
import { isDarkThemeSet, isLightThemeSet, initTheme } from './common/theme_manager'

export default (window.$ = window.jQuery = jquery);

import Main from './components/main/main.riot'
import i18next from "i18next";
import {formatNumber} from "./common/helpers";

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

})

component(Main)(document.getElementById('app'), {})
