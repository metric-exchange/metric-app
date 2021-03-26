
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

    let headers = new Headers();

    headers.set("Content-Type", "application/json")

    return await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(content)
        })
        .then(handleErrors)
}

function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}
