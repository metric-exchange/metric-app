import { HttpClient } from "@0x/connect"
import {HidingGameProxy} from "./HidingGameProxy";
import {ZeroXV4OrderProxy} from "./ZeroXV4OrderProxy";

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

    let zeroXV4Proxy = new ZeroXV4OrderProxy()
    await getHidingGameProxy().init()

    let hiddenOrders = await getHidingGameProxy().getOrders(address)

    let zeroXV3Orders = await relay.getOrdersAsync({
        makerAddress: address,
        perPage: 100
    }).then(r => r.records)

    let zeroXV4Orders = await zeroXV4Proxy.getOrders(address)

    zeroXV3Orders.forEach(o => {
       o.isHidingBook = false
       o.version = 3
    })

    zeroXV4Orders.forEach(o => {
        o.isHidingBook = false
        o.version = 4
    })

    hiddenOrders.forEach(o => {
       o.isHidingBook = true
       o.version = 4
    })

   return zeroXV3Orders.concat(zeroXV4Orders).concat(hiddenOrders)
}

export function getHidingGameProxy() {
    return hidingGameProxy
}

let relay = new HttpClient("https://api.0x.org/sra/v3")
let hidingGameProxy = new HidingGameProxy()
let orders = []
let register = []
