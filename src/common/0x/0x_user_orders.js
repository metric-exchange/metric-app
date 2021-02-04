import {accountAddress, isWalletConnected} from "../wallet/wallet_manager";
import { HttpClient } from "@0x/connect"
import Rollbar from "rollbar";
import {HidingGameProxy} from "./HidingGameProxy";

export function userOrders() {
    return orders
}

export function registerForUserOrderUpdates(item) {
    register.push(item)
}

export async function synchronizeUserOrders(userAddress) {
    await getHidingGameProxy().init()
    if (isWalletConnected()) {
        if (userAddress === accountAddress()) {
            try {
                orders = await retrieveUserOrders(accountAddress())
                await Promise.all(register.map(async (item) => await item.onUserOrderUpdates()))
            } catch (e) {
                Rollbar.warn(`user order fetch failed, will keep retrying ${e}`)
            }
        }
    }

    if (!isWalletConnected() || (userAddress === accountAddress())) {
        setTimeout(synchronizeUserOrders, 10000, userAddress)
    }
}

async function retrieveUserOrders(address) {
    let hiddenOrders = await getHidingGameProxy().getOrders(address)

    let zeroXOrders = await relay.getOrdersAsync({
        makerAddress: address,
        perPage: 100
    }).then(r => r.records)

   zeroXOrders.forEach(o => o.version = 3)
   hiddenOrders.forEach(o => o.version = 4)

   return zeroXOrders.concat(hiddenOrders)
}

export function getHidingGameProxy() {
    return hidingGameProxy
}

let relay = new HttpClient("https://api.0x.org/sra/v3")
let hidingGameProxy = new HidingGameProxy()
let orders = []
let register = []
