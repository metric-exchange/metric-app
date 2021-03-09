
export function registerForThemeUpdates(callback) {
    registeredCallback.push(callback)
}

export function initTheme() {
    if (isDarkThemeSet()) {
        document.documentElement.setAttribute('data-theme', darkTheme());
    } else {
        document.documentElement.setAttribute('data-theme', lightTheme());
    }
}

export function setDarkTheme() {
    setTheme(darkTheme())
}

export function setLightTheme() {
    setTheme(lightTheme())
}

export function isDarkThemeSet() {
    return getTheme() === darkTheme()
}

export function isLightThemeSet() {
    return getTheme() === lightTheme() || getTheme() === null
}

function getTheme() {
    return localStorage.getItem('theme')
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    registeredCallback.forEach(item => item.updateTheme())
}

function darkTheme() {
    return 'dark'
}

function lightTheme() {
    return 'light'
}

let registeredCallback = []
