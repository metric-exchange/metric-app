import {accountAddress, isWalletConnected} from "../wallet/wallet_manager";
import { HttpClient } from "@0x/connect"

export function userOrders() {
    return orders
}

export function registerForUserOrderUpdates(item) {
    register.push(item)
}

export async function synchronizeUserOrders() {
    if (isWalletConnected()) {
        orders = await retrieveUserOrders(accountAddress())
        await Promise.all(register.map(async (item) => await item.onUserOrderUpdates()))
    }

    setTimeout(synchronizeUserOrders, 10000)
}

async function retrieveUserOrders(address) {
    return await relay.getOrdersAsync({
        makerAddress: address,
        perPage: 100
    }).then(r => r.records)
}

let relay = new HttpClient("https://api.0x.org/sra/v3")
let orders = []
let register = []
