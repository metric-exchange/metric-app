import {ObservationRegister} from "./ObservationRegister";

export class OrderStateManager {

    constructor() {
        this.locked = false
        this.current = { code: OrderState.STALE }
        this.status = OrderStateManager.IN_PROGRESS
        this.observers = new ObservationRegister()
    }

    observe(observer, callback) {
        this.observers.register(observer, callback)
    }

    lock() {
        this.locked = true
    }

    unlock() {
        this.locked = false
    }

    async setInProgressState(state, params = {}, bypassLock = false) {
        await this.setState(state, OrderStateManager.IN_PROGRESS, params, bypassLock)
    }

    async setReadyState(state, params = {}, bypassLock = false) {
        await this.setState(state, OrderStateManager.READY, params, bypassLock)
    }

    async setInvalidState(state, params = {}, bypassLock = false) {
        await this.setState(state, OrderStateManager.INVALID, params, bypassLock)
    }

    async setInfoState(state, params = {}, bypassLock = false) {
        await this.setState(state, OrderStateManager.INFO, params, bypassLock)
    }

    async setState(state, status, params, bypassLock) {
        if (bypassLock || !this.locked) {
            this.status = status
            this.current = { code: state, params: params }
            await Promise.all(this.observers.toNotify({}, state))
        }
    }

    isReady() {
        return this.status === OrderStateManager.READY
    }

    isInProgress() {
        return this.status === OrderStateManager.IN_PROGRESS
    }

    isInvalid() {
        return this.status === OrderStateManager.INVALID
    }

    static INVALID = -1
    static IN_PROGRESS = 0
    static INFO = 1
    static READY = 2

}

export const OrderState = {
    STALE                           : 0,
    NO_WALLET_CONNECTION            : 10,
    ETH_NOT_ALLOWED                 : 20,
    UNKNOWN_METRIC_BALANCE          : 30,
    ORDER_PARAMS_NOT_FILLED         : 40,
    SWAP_PARAMS_NOT_FILLED          : 50,
    UNKNOWN_TOKEN_BALANCE           : 60,
    INSUFFICIENT_TOKEN_BALANCE      : 70,
    UNKNOWN_TOKEN_ALLOWANCE         : 80,
    INSUFFICIENT_TOKEN_ALLOWANCE    : 100,
    LIMIT_ORDER_BELOW_MARKET_PRICE  : 105,
    VALID_ORDER                     : 110,
    VALID_WRAP                      : 120,
    VALID_UNWRAP                    : 130,
    APPROVING_TOKEN                 : 200,
    MATCHING_ORDER                  : 210,
    FILLING_ORDER                   : 220,
    ORDER_FILLED                    : 230,
    OPENING_LIMIT_ORDER             : 240,
    SWAPPING                        : 250,
    REJECTED                        : 300
}
