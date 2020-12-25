import numeral from "numeral";

export function formatNumber(n, precision = 3) {
    return numeral(n).format(precisionToFormat(precision)).toUpperCase()
}

function precisionToFormat(precision) {
    let format = precision > 0 ? "0,0." : "0,0"
    for(let i = 0; i < precision; i++) {
        format += "0"
    }

    return `${format}`
}
