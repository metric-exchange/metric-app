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
    NO_WALLET_CONNECTION            : 1,
    ETH_NOT_ALLOWED                 : 2,
    UNKNOWN_METRIC_BALANCE          : 3,
    ORDER_PARAMS_NOT_FILLED         : 4,
    SWAP_PARAMS_NOT_FILLED          : 5,
    UNKNOWN_TOKEN_BALANCE           : 6,
    INSUFFICIENT_TOKEN_BALANCE      : 7,
    UNKNOWN_TOKEN_ALLOWANCE         : 8,
    INSUFFICIENT_TOKEN_ALLOWANCE    : 9,
    VALID_ORDER                     : 100,
    VALID_WRAP                      : 101,
    VALID_UNWRAP                    : 102,
    APPROVING_TOKEN                 : 201,
    MATCHING_ORDER                  : 202,
    FILLING_ORDER                   : 203,
    ORDER_FILLED                    : 204,
    OPENING_LIMIT_ORDER             : 205,
    SWAPPING                        : 206,
    REJECTED                        : 300
}
