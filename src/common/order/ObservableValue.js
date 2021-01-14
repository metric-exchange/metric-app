import {ObservationRegister} from "./ObservationRegister";

export class ObservableValue {

    constructor(value) {
        this.value = value
        this.observers = new ObservationRegister()
    }

    observe(observer, callback) {
        this.observers.register(observer, callback)
    }

    async set(source, value) {
        this.value = value
        await Promise.all(this.observers.toNotify(source, value))
    }

}
