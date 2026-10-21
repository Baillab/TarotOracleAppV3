// Переводы интерфейса. Ключ — исходный русский текст: если перевода нет,
// показывается сам ключ, поэтому приложение не может остаться «без текста».
// Словари: src/locales/<код>.json  { "русский текст": "перевод" }

const dictionaries = {}   // { en: {...}, fr: {...} } — подключаются на следующих шагах

let current = "ru"

export function setLang(code) {
    current = dictionaries[code] || code === "ru" ? code : "ru"
}

export function getLang() {
    return current
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