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
    try {
        orders = await retrieveUserOrders(userAddress)
        await Promise.all(register.map(async (item) => await item.onUserOrderUpdates()))
    } catch (e) {
        console.warn(`user order fetch failed, will keep retrying ${e}`)
    }
}

async function retrieveUserOrders(address) {
    await getHidingGameProxy().init()
    let hiddenOrders = await getHidingGameProxy().getOrders(address)

    let zeroXOrders = await relay.getOrdersAsync({
        makerAddress: address,
        perPage: 100
    }).then(r => r.records)

   zeroXOrders.forEach(o => o.isHidingBook = false)
   hiddenOrders.forEach(o => o.isHidingBook = true)

   return zeroXOrders.concat(hiddenOrders)
}

export function getHidingGameProxy() {
    return hidingGameProxy
}

let relay = new HttpClient("https://api.0x.org/sra/v3")
let hidingGameProxy = new HidingGameProxy()
let orders = []
let register = []
