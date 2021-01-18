
export class OrderEventSource {

    constructor(property, action) {
        this.property = property
        this.action = action
    }
}

export class OrderEventActions {
    static Input = 0
    static SetToMax = 1
    static TokenChange = 2
    static Refresh = 3
    static Reset = 4
    static Click = 5
    static Inversion = 6
    static Calculation = 7
}

export class OrderEventProperties {
    static SellAmount = 0
    static BuyAmount = 1
    static Price = 2
    static Tokens = 3
}
