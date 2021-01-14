
export function setSlippageConfig(slippage) {
    localStorage.setItem('slippage', slippage)
}

export function getSlippageConfig() {
    let storedSlippage = localStorage.getItem('slippage')
    if (storedSlippage === null) {
        return DEFAULT_SWAP_SLIPPAGE
    } else {
        return parseFloat(storedSlippage)
    }
}

let DEFAULT_SWAP_SLIPPAGE = 0.001