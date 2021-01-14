
export class ObservationRegister {

    constructor() {
        this._register = []
    }

    register(observer, callback) {
        this._register.push({
            observer: observer,
            callback: callback
        })
    }

    toNotify(source, event = undefined) {
        return this._register.map(async (o) => {await o.observer[o.callback](source, event)})
    }

}
