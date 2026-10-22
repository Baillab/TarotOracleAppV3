
// Переводы интерфейса. Ключ — исходный русский текст: если перевода нет,
// показывается сам ключ, поэтому приложение не может остаться «без текста».
// Словари: src/locales/<код>.json  { "русский текст": "перевод" }

import en from './locales/en.json'

// Подключённые словари: { en: {...}, fr: {...} }
const dictionaries = { en }

// ready: язык можно выбирать в «Настройках»
export const LANGS = [
    { code: "ru", name: "Русский", ready: true },
    { code: "en", name: "English", ready: true },
    { code: "fr", name: "Français", ready: false },
]

const STORAGE_KEY = "tarot.lang"

// Подбирать язык по языку устройства при первом запуске. Пока выключено:
// приложение стартует на русском, пока пользователь сам не выберет другой язык.
const AUTO_DETECT = false

let current = "ru"

function isAvailable(code) {
    return code === "ru" || (!!dictionaries[code] && LANGS.some(l => l.code === code && l.ready))
}

function readSaved() {
    try { return localStorage.getItem(STORAGE_KEY) } catch (e) { return null }
}

function writeSaved(code) {
    try { localStorage.setItem(STORAGE_KEY, code) } catch (e) { /* без сохранения тоже работаем */ }
}

// Язык при запуске: сохранённый выбор → язык устройства (если он поддержан) → русский
function initLang() {
    const saved = readSaved()
    if (saved && isAvailable(saved)) {
        current = saved
    } else {
        let dev = ""
        if (AUTO_DETECT) {
            try { dev = String(navigator.language || "").slice(0, 2).toLowerCase() } catch (e) { /* */ }
        }
        current = isAvailable(dev) ? dev : "ru"
    }
    try { document.documentElement.lang = current } catch (e) { /* */ }
}

export function getLang() {
    return current
}

// Меняет язык и запоминает выбор. Возвращает true, если язык действительно сменился.
export function setLang(code) {
    if (!isAvailable(code) || code === current) return false
    current = code
    writeSaved(code)
    try { document.documentElement.lang = code } catch (e) { /* */ }
    return true
}

// t("Текст") или t("Записей: {n}", { n: 5 })
export function t(key, vars) {
    let s = key
    try {
        const d = dictionaries[current]
        if (d && typeof d[key] === "string" && d[key]) s = d[key]
    } catch (e) { /* остаёмся на русском */ }
    if (vars) {
        s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m))
    }
    return s
}

// Выполняется при загрузке модуля — раньше любого кода, который вызывает t()
initLang()
