import numeral from "numeral";

export function formatNumber(n, precision = 3) {
    if (n === 0 || n > (1 / (10 ** precision))) {
        return numeral(n).format(precisionToFormat(precision))
    } else {
        return numeral(n).format(`${precisionToFormat(precision)}e+0`)
    }
}

function precisionToFormat(precision) {
    let format = precision > 0 ? "0,0." : "0,0"
    for(let i = 0; i < precision; i++) {
        format += "0"
    }

    return `${format}`
}
