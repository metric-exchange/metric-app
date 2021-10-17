import {HidingGameProxy} from "./HidingGameProxy";
import {ZeroXV4OrderProxy} from "./ZeroXV4OrderProxy";
import {fetchJson} from "../../JsonApiFetch";

export function userOrders() {
    return orders
}

export function registerForUserOrderUpdates(item) {
    register.push(item)
}

export async function synchronizeUserOrders(userAddress, checkV3) {
    try {
        orders = await retrieveUserOrders(userAddress, checkV3)
        await Promise.all(register.map(async (item) => await item.onUserOrderUpdates()))
    } catch (e) {
        console.warn(`user order fetch failed, will keep retrying ${e}`)
    }
}

async function retrieveUserOrders(address, checkV3) {

    let zeroXV4Proxy = new ZeroXV4OrderProxy()
    await getHidingGameProxy().init()

    let zeroXV3Orders = []
    let hiddenOrders = []

    if (checkV3) {
        let v3Orders = await fetchJson(`https://api.0x.org/sra/v3/orders?makerAddress=${address}&&perPage=100`)
        zeroXV3Orders = v3Orders.records

        zeroXV3Orders.forEach(o => {
            o.isHidingBook = false
            o.version = 3
        })

        let hiddenOrders = await getHidingGameProxy().getOrders(address)
        hiddenOrders.forEach(o => {
            o.isHidingBook = true
            o.version = 4
        })
    }

    let zeroXV4Orders = await zeroXV4Proxy.getOrders(address)
    zeroXV4Orders.forEach(o => {
        o.isHidingBook = false
        o.version = 4
    })

   return zeroXV3Orders.concat(zeroXV4Orders).concat(hiddenOrders)
}

export function getHidingGameProxy() {
    return hidingGameProxy
}

let hidingGameProxy = new HidingGameProxy()
let orders = []
let register = []
