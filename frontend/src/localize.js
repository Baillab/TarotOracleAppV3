// Перевод данных, которые приходят из Go (карты, расклады, вопросы, руководство, юридические тексты).
// Русские данные остаются в assets/tarot/*.json; английские лежат в locales/en.data.json
// и подставляются по id карты / расклада / ключу позиции / русскому тексту.
// Если перевода нет — остаётся русский оригинал. Для русского языка данные не трогаются вообще.

import enData from './locales/en.data.json'
import { getLang, t } from './i18n.js'

const DATA = { en: enData }

const CARD_ID = /^(major|wands|cups|swords|pentacles)_\d{2}$/

function dict() {
    const lang = getLang()
    return lang === "ru" ? null : (DATA[lang] || null)
}

function localizeCard(c, d) {
    const e = d.cards && d.cards[c.id]
    if (!e) return c
    return {
        ...c,
        name: e.name || c.name,
        keywords: e.keywords || c.keywords,
        upright: { ...c.upright, ...e.upright },
        reversed: { ...c.reversed, ...e.reversed },
    }
}

function localizePosition(p, sid, d) {
    let e = null
    if (sid && d.spreads[sid]) e = d.spreads[sid].positions[p.key]
    if (!e) {
        // без контекста расклада — по ключу позиции (названия по ключам совпадают во всех раскладах)
        for (const s of Object.values(d.spreads)) {
            if (s.positions[p.key]) { e = s.positions[p.key]; break }
        }
    }
    if (!e) return p
    const out = { ...p }
    if (e.name !== undefined && p.name !== undefined) out.name = e.name
    if (e.description && p.description) out.description = e.description
    return out
}

function walk(x, d, sid) {
    if (Array.isArray(x)) return x.map(v => walk(v, d, sid))
    if (!x || typeof x !== "object") return x

    if (typeof x.id === "string" && CARD_ID.test(x.id) && x.upright) return localizeCard(x, d)

    // контекст расклада: результат гадания (spread), запись истории (spreadId)
    let ctx = sid
    if (x.spread && typeof x.spread.id === "string") ctx = x.spread.id
    else if (typeof x.spreadId === "string" && x.spreadId) ctx = x.spreadId

    const out = {}
    for (const k of Object.keys(x)) out[k] = walk(x[k], d, ctx)

    // расклад: название, описание, позиции
    if (typeof x.id === "string" && Array.isArray(x.positions) && d.spreads[x.id]) {
        const s = d.spreads[x.id]
        out.name = s.name
        if (s.description) out.description = s.description
        out.positions = x.positions.map(p => localizePosition(p, x.id, d))
    }
    // позиция карты внутри результата расклада
    else if (typeof x.key === "string" && x.name !== undefined && x.index !== undefined && !Array.isArray(x.positions)) {
        return localizePosition(out, ctx, d)
    }
    // запись истории: название
    if (typeof x.type === "string" && Array.isArray(x.cards) && typeof x.name === "string") {
        out.name = (d.names && d.names[x.name]) || t(x.name)
    }
    return out
}

export function localizeData(x) {
    const d = dict()
    if (!d) return x
    try { return walk(x, d, "") } catch (e) { console.error("localize:", e); return x }
}

// Вопросы: [{ id, label, questions: [...] }]
export function localizeQuestions(list) {
    const d = dict()
    if (!d || !Array.isArray(list) || !d.questions) return list
    try {
        return list.map(c => ({
            ...c,
            label: (d.questions.labels && d.questions.labels[c.id]) || c.label,
            questions: (c.questions || []).map(q => (d.questions.texts && d.questions.texts[q]) || q),
        }))
    } catch (e) { console.error("localize questions:", e); return list }
}

// Руководство и «О картах Таро»: [{ title, text }] — по русскому заголовку
function localizeSections(list, table) {
    const d = dict()
    if (!d || !Array.isArray(list) || !d[table]) return list
    try {
        return list.map(s => {
            const e = d[table][s.title]
            return e ? { ...s, title: e.title, text: e.text } : s
        })
    } catch (e) { console.error("localize " + table + ":", e); return list }
}

export const localizeGuide = list => localizeSections(list, "guide")
export const localizeAbout = list => localizeSections(list, "about")

// Юридические тексты: { privacy: {title, paragraphs}, terms: {...} }
export function localizeLegal(legal) {
    const d = dict()
    if (!d || !legal || !d.legal) return legal
    try {
        const out = { ...legal }
        for (const k of Object.keys(d.legal)) if (legal[k]) out[k] = { ...legal[k], ...d.legal[k] }
        return out
    } catch (e) { console.error("localize legal:", e); return legal }
}
