import numeral from "numeral";

export function formatNumber(n, precision = 3, fixedWidth = false) {
    if (n === 0 || n > (1 / (10 ** precision))) {
        return numeral(n).format(precisionToFormat(precision, fixedWidth))
    } else {
        return numeral(n).format(`${precisionToFormat(precision, fixedWidth)}e+0`)
    }
}

function precisionToFormat(precision, fixedWidth) {
    let format = "0,0"

    if (precision > 0) {
        if (fixedWidth) {
            format = "0,0."
        } else {
            format = "0,0.["
        }

        for(let i = 0; i < precision; i++) {
            format += "0"
        }

        if (!fixedWidth) {
            format += "]"
        }

    }

    return `${format}`
}
