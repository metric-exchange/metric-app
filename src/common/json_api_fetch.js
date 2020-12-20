
export async function fetchJson(url) {

    let tryJson =
        await fetch(url, {method: "GET"})
            .then(handleErrors)
            .then(r => r.json())
            .catch(e => console.error("Json Api call failed with:", e.message))

    if (tryJson === undefined) {
        tryJson = {}
    }

    return tryJson
}

function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}
