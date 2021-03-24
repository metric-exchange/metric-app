
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
    return await fetch(url, {
            method: 'POST',
            body: JSON.stringify(content)
        })
        .then(handleErrors)
        .then(r => r.json())
}

function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}
