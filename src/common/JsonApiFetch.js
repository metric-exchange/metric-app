import axios from "axios";

export async function fetchJson(url) {

    let tryJson =
        await fetch(url, {method: "GET"})
            .then(handleErrors)
            .then(r => r.json())

    if (tryJson === undefined) {
        tryJson = {}
    }

    return tryJson
}

export async function postJson(url, content) {
    await axios({
        method: 'POST',
        url: url,
        data: content
    });
}

function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}
