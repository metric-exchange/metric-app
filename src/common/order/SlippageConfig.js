
export function setSlippageConfig(slippage) {
    localStorage.setItem('v2.slippage', slippage)
}

export function getSlippageConfig() {
    let storedSlippage = localStorage.getItem('v2.slippage')
    if (storedSlippage === null) {
        return DEFAULT_SWAP_SLIPPAGE
    } else {
        return parseFloat(storedSlippage)
    }
}

let DEFAULT_SWAP_SLIPPAGE = 0.005