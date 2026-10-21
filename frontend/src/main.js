import './app.css'
import overviewTexts from './overview.json'
import { t } from './i18n.js'

import {
    DrawCard,
    Shuffle,
    GetDailyCard,
    DrawSpread,
    GetSpreads,
    GetHistory,
    DeleteHistoryRecord,
    ClearHistory,
    GetQuestions,
    GetSettings,
    UpdateSetting,
    RemainingCards,
    RemainingCardsList,
    FullDeck,
    GetGuide,
    GetLegal,
    UpdateHistoryComment,
    GetAboutTarot
} from '../bindings/tarotoracleapp/tarotservice.js'

import * as TarotApi from '../bindings/tarotoracleapp/tarotservice.js'




// ==========================================
// Интерфейс
// ==========================================

document.querySelector("#app").innerHTML = `
 
<div class="layout">
 
 
    <aside class="sidebar">
 
 
        <h1 class="logo">
 
            ✦ Tarot Oracle ✦
 
        </h1>
 
 
 
        <div class="menu-panel" id="menu-panel">
        <div class="menu">
 
 
            <button id="draw" class="action-button">
 
                ${t("✦ Вытянуть карту")}
 
            </button>
 
 
 
            <button id="daily" class="action-button">
 
                ${t("✦ Карта дня")}
 
            </button>
 
 
        </div>
 
 
 
        <div class="spread-title">
 
            ${t("Выберите расклад")}
 
        </div>
 
 
 
        <div class="spread-strip" id="spread-strip">
 
            <button class="strip-arrow strip-arrow-left" id="strip-left" aria-label="${t("Прокрутить расклады влево")}"><span>‹</span></button>
 
            <div id="spread-list" class="spread-list">
 
            </div>
 
            <button class="strip-arrow strip-arrow-right" id="strip-right" aria-label="${t("Прокрутить расклады вправо")}"><span>›</span></button>
 
        </div>
        </div>
 
 
 
        <div class="icon-row">
 
 
    <button id="shuffle" class="icon-button" title="${t("Перемешать")}" data-label="${t("Перемешать")}">
 
        🂠
 
    </button>
 
 
 
    <button id="history" class="icon-button" title="${t("История")}" data-label="${t("История")}">
 
        🕒
 
    </button>
 
 
 
    <button id="deck-info" class="icon-button" title="${t("Колода")}" data-label="${t("Колода")}">
 
        🗂
 
    </button>
 
 
 
    <button id="settings" class="icon-button" title="${t("Настройки")}" data-label="${t("Настройки")}">
 
        ⚙
 
    </button>
 
 
 
    <button id="interpretation-icon" class="icon-button" title="${t("Толкование расклада")}" data-label="${t("Толкование")}">
 
        📖
 
    </button>
 
 
</div>
 
 
    </aside>
 
 
 
    <header class="topbar" id="topbar">
        <button id="topbar-menu" class="topbar-menu" aria-label="${t("Открыть меню раскладов")}">${t("☰ Расклады")}</button>
        <div id="topbar-title" class="topbar-title"></div>
        <span></span>
    </header>
    <div id="menu-backdrop" class="menu-backdrop"></div>
 
 
    <main class="scene">
 
 
        <div id="result">
 
        </div>
 
 
        <div id="shuffle-animation" class="shuffle-animation hidden">
 
    <div class="shuffle-card"></div>
 
    <div class="shuffle-card"></div>
 
    <div class="shuffle-card"></div>
 
    <div class="shuffle-card"></div>
 
    <div class="shuffle-card"></div>
 
</div>
 
 
 
<div id="toast" class="toast"></div>
 
 
 
        <div id="interpretation-panel" class="interpretation-panel">
 
        </div>
 
 
    </main>
 
 
 
    <div id="card-modal" class="modal-overlay hidden">
 
        <div class="modal-content" id="modal-content">
 
        </div>
 
    </div>
 
 
 
</div>
 
`



// ==========================================
// Элементы
// ==========================================


const result =
    document.querySelector("#result")



const spreadList =
    document.querySelector("#spread-list")



const spreadStrip =
    document.querySelector("#spread-strip")



// Стрелки ‹ › у ленты раскладов: показываем только там,
// куда ещё можно прокрутить

function updateSpreadStrip() {

    const max =
        spreadList.scrollWidth - spreadList.clientWidth



    spreadStrip.classList.toggle(
        "can-left",
        spreadList.scrollLeft > 4
    )



    spreadStrip.classList.toggle(
        "can-right",
        spreadList.scrollLeft < max - 4
    )

}



spreadList.addEventListener("scroll", updateSpreadStrip, { passive: true })



document
    .querySelector("#strip-left")
    .onclick = () => spreadList.scrollBy({

        left: -spreadList.clientWidth * 0.7,

        behavior: "smooth",

    })



document
    .querySelector("#strip-right")
    .onclick = () => spreadList.scrollBy({

        left: spreadList.clientWidth * 0.7,

        behavior: "smooth",

    })



let activeButton =
    null


// пересчёт текущего расклада (после сворачивания шапки, поворота экрана)

let currentSpreadRelayout =
    null


let appSettings = {

    deckMode: "full",

    drawMode: "sequential",

    language: "ru",

    deckStyle: "classic",

}

// ==========================================
// Анимация перемешивания
// ==========================================


async function initSettings() {

    try {

        const settings =
            await GetSettings()



        appSettings = { ...appSettings, ...settings }



    }

    catch (e) {

        console.error(e)

    }

}



function setActive(button) {

    if (activeButton) {

        activeButton.classList.remove("active")

    }

    button.classList.add("active")

    activeButton = button

}




// ==========================================
// Анимация перемешивания
// ==========================================

function playShuffleAnimation() {

    return new Promise((resolve) => {

        const container =
            document.querySelector("#shuffle-animation")



        container.classList.remove("hidden")



        const cards =
            container.querySelectorAll(".shuffle-card")



        const duration = 900



        const offsets = [

            { x: -70, rot: -18 },

            { x: -35, rot: -9 },

            { x: 0, rot: 0 },

            { x: 35, rot: 9 },

            { x: 70, rot: 18 },

        ]



        cards.forEach((card, i) => {

            const o =
                offsets[i]



            card.animate(
                [

                    {
                        transform: "translate(-50%, -50%) scale(.85) rotate(0deg)",
                        opacity: 0,
                    },

                    {
                        transform: `translate(calc(-50% + ${o.x}px), -50%) scale(1) rotate(${o.rot}deg)`,
                        opacity: 1,
                        offset: 0.4,
                    },

                    {
                        transform: `translate(calc(-50% + ${o.x}px), -50%) scale(1) rotate(${o.rot}deg)`,
                        opacity: 1,
                        offset: 0.7,
                    },

                    {
                        transform: "translate(-50%, -50%) scale(.85) rotate(0deg)",
                        opacity: 0,
                    },

                ],

                {

                    duration,

                    easing: "ease-in-out",

                    delay: i * 40,

                },
            )

        })



        setTimeout(() => {

            container.classList.add("hidden")



            resolve()



        }, duration + cards.length * 40 + 50)

    })

}



// ==========================================
// Толкование (общее для карты и раскладов)
// ==========================================


function setInterpretation(html) {

    document
        .querySelector("#interpretation-panel")
        .innerHTML = `
 
            <div class="interpretation-header">
 
                ${t("✦ Толкование ✦")}
 
            </div>
 
 
 
            <div class="interpretation-body">
 
                ${html}
 
            </div>
 
        `

}

// ==========================================
// Комментарий — модальное окно
// ==========================================

function openCommentModal(historyId, existingComment, onSaved) {

    const modal =
        document.querySelector("#card-modal")



    const content =
        document.querySelector("#modal-content")



    content.innerHTML = `
 
 
        <button class="modal-close" id="modal-close">
 
            ✕
 
        </button>
 
 
 
        <h2 class="question-title">
 
            ${t("Ваш комментарий")}
 
        </h2>
 
 
 
        <textarea
 
            id="comment-textarea"
 
            class="comment-textarea"
 
            placeholder="${t("Добавьте заметку об этом раскладе...")}"
 
            rows="5"
 
        >${existingComment || ""}</textarea>
 
 
 
        <div class="question-actions">
 
 
            <button id="comment-save" class="confirm-btn confirm-yes-gold">
 
                ${t("Сохранить")}
 
            </button>
 
 
        </div>
 
 
    `



    modal.classList.remove("hidden")



    modal.classList.remove("opening")



    modal.classList.remove("closing")



    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            modal.classList.add("opening")

        })

    })



    document
        .querySelector("#modal-close")
        .onclick = closeCardModal



    document
        .querySelector("#comment-save")
        .onclick = async () => {

            const text =
                document.querySelector("#comment-textarea").value.trim()



            try {

                await UpdateHistoryComment(historyId, text)



                if (onSaved) onSaved(text)



                closeCardModal()



                showToast("Комментарий сохранён")


            }

            catch (e) {

                console.error(e)

            }

        }

}

function rebindCommentButton(record) {

    const commentBtn =
        result.querySelector(".comment-icon-btn")



    if (commentBtn) {

        commentBtn.onclick = () => {

            openCommentModal(
                record.id,
                record.comment || "",
                (savedText) => {

                    record.comment = savedText

                }
            )

        }

    }

}




document
    .querySelector("#interpretation-icon")
    .onclick = (e) => {

        e.stopPropagation()



        document
            .querySelector("#interpretation-panel")
            .classList.toggle("open")

    }


document.addEventListener("click", (e) => {

    const panel =
        document.querySelector("#interpretation-panel")



    if (!panel.classList.contains("open")) return



    const clickedInsidePanel =
        panel.contains(e.target)



    const clickedIcon =
        e.target.closest("#interpretation-icon")



    if (!clickedInsidePanel && !clickedIcon) {

        panel.classList.remove("open")

    }

})



// ==========================================
// Класс цвета для быстрого ответа
// ==========================================


function answerClass(text) {

    switch (text) {

        case "Да":
            return "answer-yes"

        case "Скорее да":
            return "answer-mostly-yes"

        case "Неопределённо":
            return "answer-neutral"

        case "Скорее нет":
            return "answer-mostly-no"

        case "Нет":
            return "answer-no"

        default:
            return ""

    }

}



// ==========================================
// Ключевые слова
// ==========================================


function keywordsHTML(card) {

    if (!card.keywords || !card.keywords.length) {

        return ""

    }

    return `
 
        <div class="keywords">
 
            ${card.keywords.map(
        k => `<span class="keyword-tag">${k}</span>`
    ).join("")}
 
        </div>
 
    `

}



// ==========================================
// Вкладки с полной информацией по карте
// (без "Общее" — текст уже показан отдельно)
// ==========================================


function cardMeaningTabs(card, isReversed, prefix) {

    const m =
        isReversed ? card.reversed : card.upright



    const tabs = [

        { key: "love", label: t("Любовь"), value: m.love },

        { key: "career", label: t("Карьера"), value: m.career },

        { key: "finance", label: t("Финансы"), value: m.finance },

        { key: "health", label: t("Здоровье"), value: m.health },

        { key: "advice", label: t("Совет"), value: m.advice },

    ]



    const buttons =
        tabs.map(
            (tab, i) => `
 
                <button
 
                    class="tab-btn ${i === 0 ? "active" : ""}"
 
                    data-tab-group="${prefix}"
 
                    data-tab-key="${tab.key}"
 
                >
 
                    ${tab.label}
 
                </button>
 
            `
        ).join("")



    const panels =
        tabs.map(
            (tab, i) => `
 
                <div
 
                    class="tab-panel ${i === 0 ? "active" : ""}"
 
                    data-tab-group="${prefix}"
 
                    data-tab-panel="${tab.key}"
 
                >
 
                    ${tab.value}
 
                </div>
 
            `
        ).join("")



    return `
 
        <div class="card-tabs">
 
            ${buttons}
 
        </div>
 
 
 
        <div class="card-tab-panels">
 
            ${panels}
 
        </div>
 
    `

}



// ==========================================
// Переключение вкладок (делегирование)
// ==========================================

document.addEventListener("click", (e) => {

    const btn =
        e.target.closest(".tab-btn")



    if (!btn) return



    const group =
        btn.dataset.tabGroup



    const key =
        btn.dataset.tabKey



    document
        .querySelectorAll(`.tab-btn[data-tab-group="${group}"]`)
        .forEach(b => b.classList.remove("active"))



    btn.classList.add("active")



    document
        .querySelectorAll(`.tab-panel[data-tab-group="${group}"]`)
        .forEach(p => p.classList.remove("active"))



    // у вкладок колоды свои панели (.tab-panel-deck) — их переключает отдельный
    // обработчик; здесь панели может не быть
    const panel = document
        .querySelector(`.tab-panel[data-tab-group="${group}"][data-tab-panel="${key}"]`)

    if (panel) panel.classList.add("active")

})



// ==========================================
// Модальное окно карты
// ==========================================

function openCardModal(item) {

    const modal =
        document.querySelector("#card-modal")



    const content =
        document.querySelector("#modal-content")



    const card =
        item.card



    const meaning =
        item.isReversed
            ? card.reversed
            : card.upright



    content.innerHTML = `
 
 
        <button class="modal-close" id="modal-close">
 
            ✕
 
        </button>
 
 
 
        <img
 
            class="card-image ${item.isReversed ? "reversed" : ""}"
 
            src="/${card.image}"
 
        >
 
 
 
        <h2>
 
            ${card.name}${item.isReversed ? t(" (перевёрнутая)") : ""}
 
        </h2>
 
 
 
        ${keywordsHTML(card)}
 
 
 
        ${item.quickAnswer ? `
 
            <div class="quick-answer ${answerClass(item.quickAnswer)}">
 
                ${t(item.quickAnswer)}
 
            </div>
 
        ` : ""}
 
 
 
        <p>
 
            ${meaning.text}
 
        </p>
 
 
 
        ${cardMeaningTabs(card, item.isReversed, "modal")}
 
 
    `

    modal.classList.remove("hidden")



    modal.classList.remove("opening")

    modal.classList.remove("closing")



    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            modal.classList.add("opening")

        })

    })




    document
        .querySelector("#modal-close")
        .onclick = closeCardModal

}


// ==========================================
// Диалог подтверждения
// ==========================================


function showConfirm(text, onConfirm, yesLabel) {

    const modal =
        document.querySelector("#card-modal")



    const content =
        document.querySelector("#modal-content")



    content.innerHTML = `
 
 
        <button class="modal-close" id="modal-close">
 
            ✕
 
        </button>
 
 
 
        <p class="confirm-text">
 
            ${text}
 
        </p>
 
 
 
        <div class="confirm-actions">
 
 
            <button id="confirm-yes" class="confirm-btn confirm-yes">
 
                ${yesLabel || t("Да, очистить")}
 
            </button>
 
 
 
            <button id="confirm-no" class="confirm-btn confirm-no">
 
                ${t("Отмена")}
 
            </button>
 
 
        </div>
 
 
    `

    modal.classList.remove("hidden")



    modal.classList.remove("opening")

    modal.classList.remove("closing")



    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            modal.classList.add("opening")

        })

    })



    document
        .querySelector("#modal-close")
        .onclick = closeCardModal



    document
        .querySelector("#confirm-no")
        .onclick = closeCardModal



    document
        .querySelector("#confirm-yes")
        .onclick = () => {

            closeCardModal()



            onConfirm()

        }

}

// ==========================================
// Модалка вопроса перед раскладом
// ==========================================


let questionCategories = null



async function openQuestionModal(spread) {

    if (!questionCategories) {

        try {

            questionCategories =
                await GetQuestions()

        }

        catch (e) {

            console.error(e)



            questionCategories = []

        }

    }



    const firstId =
        questionCategories[0]?.id



    const modal =
        document.querySelector("#card-modal")



    const content =
        document.querySelector("#modal-content")



    function chipsHTML(category) {

        return category.questions.map(
            q => `<button class="question-chip" data-q="${q}">${q}</button>`
        ).join("")

    }



    content.innerHTML = `
 
 
        <button class="modal-close" id="modal-close">
 
            ✕
 
        </button>
 
 
 
        <h2 class="question-title">
 
            ${spread.name}
 
        </h2>
 
 
 
        <p class="question-subtitle">
 
            ${t("Задайте вопрос или начните без него")}
 
        </p>
 
 
 
        <div class="question-tabs">
 
            ${questionCategories.map(
        (category, i) => `
 
                    <button
 
                        class="tab-btn ${i === 0 ? "active" : ""}"
 
                        data-tab-group="question"
 
                        data-tab-key="${category.id}"
 
                    >
 
                        ${category.label}
 
                    </button>
 
                `
    ).join("")}
 
        </div>
 
 
 
        <div class="question-chips-panels">
 
            ${questionCategories.map(
        (category, i) => `
 
                    <div
 
                        class="question-chips tab-panel-q ${i === 0 ? "active" : ""}"
 
                        data-tab-group="question"
 
                        data-tab-panel="${category.id}"
 
                    >
 
                        ${chipsHTML(category)}
 
                    </div>
 
                `
    ).join("")}
 
        </div>
 
 
 
        <textarea
 
            id="question-input"
 
            class="question-textarea"
 
            placeholder="${t("Свой вопрос...")}"
 
            rows="3"
 
        ></textarea>
 
 
 
        <div class="question-actions">
 
 
            <button id="question-skip" class="confirm-btn confirm-no">
 
                ${t("Без вопроса")}
 
            </button>
 
 
 
            <button id="question-start" class="confirm-btn confirm-yes-gold">
 
                ${t("Начать расклад")}
 
            </button>
 
 
        </div>
 
 
    `

    modal.classList.remove("hidden")



    modal.classList.remove("opening")



    modal.classList.remove("closing")



    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            modal.classList.add("opening")

        })

    })



    const textarea =
        document.querySelector("#question-input")



    document
        .querySelector("#modal-close")
        .onclick = closeCardModal



    content.querySelectorAll(".tab-btn[data-tab-group='question']").forEach(btn => {

        btn.onclick = () => {

            content.querySelectorAll(".tab-btn[data-tab-group='question']")
                .forEach(b => b.classList.remove("active"))



            btn.classList.add("active")



            content.querySelectorAll(".tab-panel-q[data-tab-group='question']")
                .forEach(p => p.classList.remove("active"))



            content.querySelector(
                `.tab-panel-q[data-tab-group='question'][data-tab-panel="${btn.dataset.tabKey}"]`
            ).classList.add("active")

        }

    })



    content.querySelectorAll(".question-chip").forEach(chip => {

        chip.onclick = () => {

            textarea.value = chip.dataset.q

        }

    })



    document
        .querySelector("#question-skip")
        .onclick = () => {

            closeCardModal()



            drawSpread(spread.id, "")

        }



    document
        .querySelector("#question-start")
        .onclick = () => {

            const question =
                textarea.value.trim()



            closeCardModal()



            drawSpread(spread.id, question)

        }

}


function closeCardModal() {

    const modal =
        document.querySelector("#card-modal")



    modal.classList.add("closing")



    setTimeout(() => {

        modal.classList.add("hidden")



        modal.classList.remove("closing")

    }, 200)

}


document
    .querySelector("#card-modal")
    .onclick = (e) => {

        if (e.target.id === "card-modal") {

            closeCardModal()

        }

    }



// ==========================================
// Загрузка раскладов
// ==========================================


let spreadsById = {}



async function loadSpreads() {


    try {


        const spreads =
            await GetSpreads()



        spreads.forEach(spread => {


            spreadsById[spread.id] = spread



            const button =
                document.createElement("button")



            button.className =
                "spread-button"



            button.textContent =
                "◈ " + spread.name


            button.onclick =
                () => {

                    setActive(button)

                    if (isMobileLayout()) {

                        button.scrollIntoView({
                            inline: "center",
                            block: "nearest",
                            behavior: "smooth",
                        })

                    }

                    openQuestionModal(spread)

                }


            spreadList.appendChild(button)

        })



        requestAnimationFrame(updateSpreadStrip)


    }


    catch (e) {


        console.error(e)


    }


}


// ==========================================
// Телефон: верхняя строка, меню раскладов, заголовок режима
// ==========================================


const layoutEl =
    document.querySelector(".layout")

const topbar =
    document.querySelector("#topbar")

const topbarTitle =
    document.querySelector("#topbar-title")

const topbarClose = document.createElement("button")

topbarClose.type = "button"

topbarClose.id = "topbar-close"

topbarClose.className = "topbar-close"

topbarClose.textContent = "✕"

topbarClose.setAttribute("aria-label", t("Закрыть и вернуться на стартовый экран"))

topbarClose.hidden = true

topbar.appendChild(topbarClose)

topbarClose.addEventListener("click", () => {

    closeMenu()

    showWelcomeDeck()

})



// Меню раскладов — оверлей по центру на затемнённом фоне

function closeMenu() {

    layoutEl.classList.remove("menu-open")

}



document
    .querySelector("#topbar-menu")
    .onclick = () => layoutEl.classList.toggle("menu-open")

document
    .querySelector("#menu-backdrop")
    .onclick = closeMenu

// выбрали расклад или действие — меню закрывается сразу, одновременно
// с появлением окна вопроса

document
    .querySelector("#menu-panel")
    .addEventListener("click", (e) => {

        if (e.target.closest(".action-button, .spread-button")) closeMenu()

    })



// Пока на сцене расклад, сцена занимает весь экран, а верхняя строка
// и нижняя панель — полупрозрачные поверх неё (класс spread-mode).
// Высоты панелей и заголовок режима обновляем здесь.

function updateChrome() {

    const hasSpread =
        !!result.querySelector(".spread-area")

    layoutEl.classList.toggle("spread-mode", hasSpread)



    let title = ""

    const marked =
        result.querySelector("[data-topbar]")

    if (marked) title = marked.dataset.topbar

    else if (result.querySelector(".daily-card")) title = t("Карта дня")

    else if (result.querySelector(":scope > .card")) title = t("Вытянуть карту")

    topbarTitle.textContent = title

    // «✕» справа: закрыть текущую картинку и вернуться на стартовый экран.
    // На самом стартовом экране кнопки нет.
    topbarClose.hidden =
        result.children.length === 0 || !!result.querySelector(".welcome-deck")



    const bar =
        document.querySelector(".icon-row")

    layoutEl.style.setProperty(
        "--topbar-h",
        Math.round(topbar.offsetHeight) + "px"
    )

    layoutEl.style.setProperty(
        "--bar-h",
        (bar ? bar.offsetHeight : 0) + "px"
    )

}



new MutationObserver(() => {

    const was =
        layoutEl.classList.contains("spread-mode")

    updateChrome()

    const now =
        layoutEl.classList.contains("spread-mode")

    if (now && !was && currentSpreadRelayout) currentSpreadRelayout()

}).observe(result, { childList: true })



// Фон приложения. Варианты: "amethyst" (Аметист), "midnight" (Полночь),
// "twilight" (Сумерки), "starry" (Звёздная ночь), "classic" (прежний фон с узором). Чтобы вернуть
// прежний простой фон, удалите следующую строку.

document.body.dataset.bg = "classic"



// Только вертикальная ориентация (где браузер это позволяет;
// в Android-приложении ориентацию задаёт AndroidManifest.xml)

try {

    screen.orientation?.lock?.("portrait")?.catch(() => { })

}

catch (e) { }



// Поворот экрана / изменение ширины окна.
// Смену только высоты (клавиатура) игнорируем — иначе расклад
// «прыгал» бы при вводе комментария.

let lastWindowWidth =
    window.innerWidth



let resizeTimer =
    null



window.addEventListener("resize", () => {

    clearTimeout(resizeTimer)



    resizeTimer = setTimeout(() => {

        updateSpreadStrip()

        updateChrome()



        if (window.innerWidth !== lastWindowWidth) {

            lastWindowWidth = window.innerWidth



            if (currentSpreadRelayout) currentSpreadRelayout()

        }

    }, 150)

})



loadSpreads()



showWelcomeDeck()

// сообщаем Android, что стартовый экран нарисован (убрать тёмную заслонку)
requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => {
    try { window.TarotNative && window.TarotNative.appReady && window.TarotNative.appReady() } catch (e) { }
}, 120)))

initSettings()



// ==========================================
// Перемешивание
// ==========================================

document
    .querySelector("#shuffle")
    .onclick = async () => {


        try {


            setActive(
                document.querySelector("#shuffle")
            )



            showWelcomeDeck()



            await playShuffleAnimation()



            const text =
                await Shuffle()



            showToast(text)



        }


        catch (e) {


            console.error(e)


        }


    }


// Карта центрируется по высоте, поэтому, если картинка догружается
// уже после показа, карта «подпрыгивает». Загружаем её заранее
// (не дольше 1.5 с, чтобы не зависнуть на медленной загрузке).

function preloadImage(path, timeout = 1500) {

    return new Promise(resolve => {

        if (!path) return resolve()

        const img = new Image()

        const done = () => resolve()

        img.onload = done

        img.onerror = done

        img.src = "/" + path

        setTimeout(done, timeout)

    })

}



// ==========================================
// Вытянуть карту
// ==========================================


document
    .querySelector("#draw")
    .onclick = async () => {


        try {


            setActive(
                document.querySelector("#draw")
            )



            const answer =
                await DrawCard()



            await preloadImage(answer.card.image)



            showCard(answer)



        }


        catch (e) {


            console.error(e)



            showMessage(
                t("Ошибка получения карты")
            )


        }


    }



// ==========================================
// Карта дня
// ==========================================


document
    .querySelector("#daily")
    .onclick = async () => {


        try {


            setActive(
                document.querySelector("#daily")
            )



            const daily =
                await GetDailyCard()



            await preloadImage(daily.card.card.image)



            showDailyCard(daily)



        }


        catch (e) {


            console.error(e)



            showMessage(
                t("Ошибка карты дня")
            )


        }


    }

// ==========================================
// История 
// ==========================================


document
    .querySelector("#history")
    .onclick = () => {

        setActive(
            document.querySelector("#history")
        )

        showHistoryList()

    }

// ==========================================
// Настройки — открытие экрана
// ==========================================


document
    .querySelector("#settings")
    .onclick = () => {

        setActive(
            document.querySelector("#settings")
        )

        showSettings()

    }



// ==========================================
// Приветственная колода
// ==========================================

function showWelcomeDeck() {


    setInterpretation(`
 
        <div class="interpretation-item">
 
            <div class="interpretation-advice">
 
                ${t("Выберите карту или расклад, чтобы увидеть толкование.")}
 
            </div>
 
        </div>
 
    `)


    result.innerHTML = `
 
 
        <div class="welcome-deck">
 
 
            <div class="deck-fan">
 
                <div class="deck-card c1"></div>
 
                <div class="deck-card c2"></div>
 
                <div class="deck-card c3"></div>
 
                <div class="deck-card c4"></div>
 
                <div class="deck-card c5"></div>
 
 
            </div>
 
 
 
            <h2 class="welcome-title">
 
                ✦ Tarot Oracle ✦
 
            </h2>
 
 
 
            <p class="welcome-text">
 
                ${isMobileLayout() ? t("Выберите карту или расклад, чтобы начать") : t("Выберите действие слева, чтобы начать")}
 
            </p>
 
 
        </div>
 
 
    `


}




// ==========================================
// Сообщение
// ==========================================

function showMessage(text) {


    setInterpretation(`
 
        <div class="interpretation-item">
 
            <div class="interpretation-advice">
 
                ${t("Выберите карту или расклад, чтобы увидеть толкование.")}
 
            </div>
 
        </div>
 
    `)



    result.innerHTML = `
 
 
        <div class="message">
 
            ${text}
 
        </div>
 
 
    `


}

// ==========================================
// Всплывающее сообщение (тост)
// ==========================================


let toastTimeout =
    null



function showToast(text) {

    const toast =
        document.querySelector("#toast")



    toast.textContent = text



    toast.classList.add("show")



    clearTimeout(toastTimeout)



    toastTimeout =
        setTimeout(() => {

            toast.classList.remove("show")

        }, 2500)

}



// ==========================================
// Показ одной карты
// ==========================================


function showCard(answer) {

    let currentComment = ""


    const card =
        answer.card



    const meaning =
        answer.isReversed
            ? card.reversed
            : card.upright




    result.innerHTML = `
 
    
 
 
        <div class="card">
 
 
            <img
 
                class="card-image ${answer.isReversed ? "reversed" : ""}"
 
                src="/${card.image}"
 
            >
 
 
            <h2>
 
    
            ${card.name}${answer.isReversed ? t(" (перевёрнутая)") : ""}
 
 
            </h2>
 
 
 
            ${keywordsHTML(card)}
 
 
 
            ${answer.quickAnswer ? `
 
                <div class="quick-answer ${answerClass(answer.quickAnswer)}">
 
                    ${t(answer.quickAnswer)}
 
                </div>
 
            ` : ""}
 
 
 
            <p>
 
                ${meaning.text}
 
            </p>
 
    ${cardMeaningTabs(card, answer.isReversed, "single")}
 
 
 
${answer.historyId ? `
 
    <button
 
        class="comment-icon-btn"
 
        data-history-id="${answer.historyId}"
 
        title="${t("Добавить комментарий")}"
 
    >
 
        📝
 
    </button>
 
        <button class="download-icon-btn" data-history-id="${answer.historyId}" title="${t("Скачать картинкой")}">⬇</button>
 
 
` : ""}
 
 
        </div>
 
 
    `






    const commentBtn =
        result.querySelector(".comment-icon-btn")



    if (commentBtn) {

        commentBtn.onclick = () => {

            openCommentModal(
                Number(commentBtn.dataset.historyId),
                currentComment,
                (savedText) => {

                    currentComment = savedText

                }
            )

        }

    }


    setInterpretation(`
 
        <div class="interpretation-item">
 
            <div class="interpretation-position">
 
                ${t("Толкование")}
 
            </div>
 
 
 
            <div class="interpretation-card">
 
                ${card.name}${answer.isReversed ? t(" (перевёрнутая)") : ""}
 
            </div>
 
 
 
            <div class="interpretation-advice">
 
                ${meaning.advice}
 
            </div>
 
        </div>
 
    `)

}



// ==========================================
// Карта дня
// ==========================================


function showDailyCard(daily) {

    let currentComment = ""

    const drawn =
        daily.card

    const card =
        drawn.card

    const meaning =
        drawn.isReversed
            ? card.reversed
            : card.upright


    result.innerHTML = `
 
 
        <div class="daily-card">
 
 
            <img
 
                class="card-image ${drawn.isReversed ? "reversed" : ""}"
 
                src="/${card.image}"
 
            >
 
 
 
            <h3>
 
                ${card.name}${drawn.isReversed ? t(" (перевёрнутая)") : ""}
 
            </h3>
 
 
 
            ${keywordsHTML(card)}
 
 
 
            ${drawn.quickAnswer ? `
 
                <div class="quick-answer ${answerClass(drawn.quickAnswer)}">
 
                    ${t(drawn.quickAnswer)}
 
                </div>
 
            ` : ""}
 
 
 
            <p>
 
                ${meaning.text}
 
            </p>
 
 
 
            ${cardMeaningTabs(card, drawn.isReversed, "daily")}
 
 
            ${drawn.historyId ? `
 
                <button
 
                    class="comment-icon-btn"
 
                    data-history-id="${drawn.historyId}"
 
                    title="${t("Добавить комментарий")}"
 
                >
 
                    📝
 
                </button>
 
        <button class="download-icon-btn" data-history-id="${drawn.historyId}" title="${t("Скачать картинкой")}">⬇</button>
 
 
            ` : ""}
 
 
        </div>
 
 
    `

    const commentBtn =
        result.querySelector(".comment-icon-btn")



    if (commentBtn) {

        commentBtn.onclick = () => {

            openCommentModal(
                Number(commentBtn.dataset.historyId),
                currentComment,
                (savedText) => {

                    currentComment = savedText

                }
            )

        }

    }



    setInterpretation(`
 
        <div class="interpretation-item">
 
            <div class="interpretation-position">
 
                ${t("Толкование")}
 
            </div>
 
 
 
            <div class="interpretation-card">
 
                ${card.name}${drawn.isReversed ? t(" (перевёрнутая)") : ""}
 
            </div>
 
 
 
            <div class="interpretation-advice">
 
                ${meaning.advice}
 
            </div>
 
        </div>
 
    `)


}


// ==========================================
// Расклад
// ==========================================

async function drawSpread(id, question) {


    result.classList.add("loading")

    await new Promise(resolve => setTimeout(resolve, 450))



    try {


        const data =
            await DrawSpread(
                id,
                question || ""
            )



        renderSpread(data, question)



    }


    catch (e) {


        console.error(e)



        showMessage(
            t("Ошибка расклада")
        )


    }


    finally {


        result.classList.remove("loading")


    }


}

// ==========================================
// Мобильная вёрстка: подгонка расклада под экран
// ==========================================


// function-объявление поднимается, поэтому безопасно вызывать
// из showWelcomeDeck() на старте; matchMedia читаем каждый раз

function isMobileLayout() {

    return window.matchMedia("(max-width: 900px)").matches

}



// Карта, положенная поперёк (≈90° / 270°), как «Препятствие»
// в Кельтском кресте

function isCrossRotation(rotation) {

    const r =
        (((rotation || 0) % 180) + 180) % 180



    return Math.abs(r - 90) < 15

}



// Точки расклада для телефона. Координаты карт растягиваем на всю
// область (одинаковые поля со всех сторон). В раскладах с поперечной
// картой («Кельтский крест») правый столбец раскладываем симметрично
// относительно центра креста.

function mobileSpreadPoints(data, W, H, force = false) {

    const pts =
        data.cards.map(c => ({
            x: c.position.x,
            y: c.position.y,
            rotation: c.position.rotation || 0,
        }))



    if (!force && !isMobileLayout()) return pts



    const tolX = W * 0.04

    const cross =
        pts.find(p => isCrossRotation(p.rotation))



    if (cross) {

        const maxX =
            Math.max(...pts.map(p => p.x))

        const col =
            pts.filter(p => maxX - p.x < tolX && p !== cross)



        if (col.length >= 3) {

            col.sort((a, b) => a.y - b.y)

            const span =
                col[col.length - 1].y - col[0].y

            const half =
                Math.min(span / 2, cross.y, H - cross.y)

            col.forEach((p, i) => {

                p.y = cross.y - half + (2 * half * i) / (col.length - 1)

            })

        }

    }



    const fill = (key, size) => {

        const vals =
            pts.map(p => p[key])

        const min =
            Math.min(...vals)

        const span =
            Math.max(...vals) - min

        pts.forEach(p => {

            p[key] =
                span > 0 ? ((p[key] - min) / span) * size : size / 2

        })

    }



    fill("x", W)

    fill("y", H)



    return pts

}



// На телефоне расклад всегда целиком умещается на экране, без
// прокрутки: подбираем наибольший размер карт, при котором ни карты,
// ни их подписи не налезают друг на друга. Возвращает масштаб карт
// и положение центров карт в процентах холста (pos[i] = {left, top}).

function fitSpreadToViewport(canvas, pts, spreadWidth, spreadHeight, margin, baseScale) {

    canvas.style.width = ""

    canvas.style.height = ""



    if (!isMobileLayout()) {

        return { scale: baseScale, pos: null }

    }



    const viewport =
        canvas.parentElement

    const vw =
        viewport.clientWidth

    const vh =
        viewport.clientHeight

    const count =
        pts.length



    // желаемая ширина картинки карты, px
    const preferred =
        count <= 3 ? 100
            : count <= 6 ? 88
                : count <= 7 ? 80
                    : 76

    const floor = 26

    const padX = 6

    const padY = 6

    const gap = 6

    const labelW = 62

    const tolX = spreadWidth * 0.04

    const tolY = spreadHeight * 0.04

    const hasCross =
        pts.some(p => isCrossRotation(p.rotation))



    // размеры «коробки» карты (картинка + подписи)
    function geometry(iw) {

        const boxW =
            Math.max(iw * 1.125 + 6, labelW)

        const boxH =
            iw * 1.75 + 64

        // карта, положенная поперёк: ширина и высота меняются местами
        return { iw, boxW, boxH, crossW: boxH, crossH: boxW }

    }



    function ext(p, g) {

        return isCrossRotation(p.rotation)
            ? { w: g.crossW, h: g.crossH }
            : { w: g.boxW, h: g.boxH }

    }



    // Центры карт по горизонтали, px. Для креста: столбцы (по близким x)
    // раздвигаем так, чтобы коробки соседних столбцов не пересекались,
    // а свободное место делим пропорционально исходным промежуткам.
    // null — при таком размере карт в ширину не помещается.

    function layoutX(g) {

        if (!hasCross) {

            return pts.map(p =>
                padX + g.boxW / 2
                + (p.x / spreadWidth) * (vw - padX * 2 - g.boxW)
            )

        }



        const order =
            pts.map((p, i) => i).sort((a, b) => pts[a].x - pts[b].x)

        const columns = []



        order.forEach(i => {

            const last =
                columns[columns.length - 1]

            if (last && pts[i].x - pts[last.members[last.members.length - 1]].x < tolX) {

                last.members.push(i)

            }

            else {

                columns.push({ members: [i] })

            }

        })



        columns.forEach(c => {

            c.cx =
                c.members.reduce((s, i) => s + pts[i].x, 0) / c.members.length

            c.w =
                Math.max(...c.members.map(i => ext(pts[i], g).w))

        })



        const avail =
            vw - padX * 2

        const minTotal =
            columns.reduce((s, c) => s + c.w, 0) + gap * (columns.length - 1)



        if (minTotal > avail) return null



        const slack =
            avail - minTotal

        const origSpan =
            columns[columns.length - 1].cx - columns[0].cx

        const xs =
            new Array(pts.length)

        let x =
            padX + columns[0].w / 2



        columns.forEach((c, k) => {

            if (k > 0) {

                const prev =
                    columns[k - 1]

                const share =
                    origSpan > 0 ? (c.cx - prev.cx) / origSpan : 0

                x += (prev.w + c.w) / 2 + gap + slack * share

            }

            c.members.forEach(i => { xs[i] = x })

        })



        return xs

    }



    // Положение по вертикали: доля высоты y/H → px.
    // Возвращает нужную высоту области, чтобы карты не налезали друг на друга.

    function neededHeight(g, xs) {

        let need = 0



        for (let i = 0; i < pts.length; i++) {

            for (let j = i + 1; j < pts.length; j++) {

                const dx =
                    Math.abs(pts[i].x - pts[j].x)

                const dy =
                    Math.abs(pts[i].y - pts[j].y)



                // одна «ячейка» (карта, положенная поперёк другой)
                if (dx < tolX && dy < tolY) continue



                const a =
                    ext(pts[i], g)

                const b =
                    ext(pts[j], g)



                // по горизонтали не пересекаются — по вертикали можно не разносить
                if (Math.abs(xs[i] - xs[j]) >= (a.w + b.w) / 2 + 2) continue



                if (dy < tolY) return Infinity



                need = Math.max(
                    need,
                    ((a.h + b.h) / 2) * spreadHeight / dy
                )

            }

        }



        return need + g.boxH + padY * 2

    }



    // top/bottom — сколько px сверху и снизу области занимают панели
    // (карты стараемся не прятать под ними)

    function build(g, xs, top, height, need) {

        // по вертикали карты не растягиваем сильнее, чем нужно: иначе
        // расклад из двух рядов расползается к краям экрана с пустотой
        // посередине. Но и не теснее минимально необходимого.

        const fullH =
            Math.max(0, height - padY * 2 - g.boxH)

        const minH =
            Math.max(0, need - padY * 2 - g.boxH)

        const capH =
            Math.max(minH, (vw - padX * 2 - g.boxW) * 1.0)

        const availH =
            Math.min(fullH, capH)

        top += (fullH - availH) / 2



        const cyOf =
            i => top + padY + g.boxH / 2 + (pts[i].y / spreadHeight) * availH

        const tops =
            pts.map((p, i) => cyOf(i))

        // Кельтский крест: верхнюю карту («Сознание») немного опускаем,
        // нижнюю («Подсознание») поднимаем на столько же — так нижняя не
        // налезает на плашку с вопросом, а расклад выглядит симметрично.
        // Сдвиг не больше свободного места до центральной карты.

        const crossI =
            pts.findIndex(p => isCrossRotation(p.rotation))

        if (crossI >= 0) {

            const col =
                pts.map((p, i) => i).filter(i =>
                    i !== crossI
                    && Math.abs(pts[i].x - pts[crossI].x) < tolX
                    && Math.abs(pts[i].y - pts[crossI].y) >= tolY
                )

            const upper =
                col.filter(i => pts[i].y < pts[crossI].y)
                    .sort((a, b) => pts[a].y - pts[b].y)[0]

            const lower =
                col.filter(i => pts[i].y > pts[crossI].y)
                    .sort((a, b) => pts[b].y - pts[a].y)[0]

            if (upper !== undefined && lower !== undefined) {

                const cC = tops[crossI]

                const room =
                    Math.min(cC - tops[upper], tops[lower] - cC) - g.boxH

                // базовый сдвиг ~5% расстояния до центра
                let d =
                    0.05 * Math.min(cC - tops[upper], tops[lower] - cC)

                const qEl =
                    document.querySelector(".spread-question")

                if (qEl) {

                    const limit =
                        vh - barH - 8 - qEl.offsetHeight - 6

                    d = Math.max(d, tops[lower] + g.boxH / 2 - limit)

                }

                d = Math.max(0, Math.min(d, room))

                tops[upper] += d

                tops[lower] -= d

            }

        }

        return {

            iw: g.iw,

            scale: g.iw / 160,

            pos: pts.map((p, i) => ({

                left: (xs[i] / vw) * 100,

                top: (tops[i] / vh) * 100,

            })),

        }

    }



    // наибольший размер карт, при котором расклад помещается
    // в область высотой height (top — отступ сверху)

    function solve(top, bottom) {

        const height =
            vh - top - bottom

        if (height <= 0) return null



        for (let iw = preferred; iw >= floor; iw -= 2) {

            const g =
                geometry(iw)

            const xs =
                layoutX(g)

            const need =
                xs ? neededHeight(g, xs) : Infinity

            if (xs && need <= height) {

                return build(g, xs, top, height, need)

            }

        }

        return null

    }



    const cs =
        getComputedStyle(layoutEl)

    const barTop =
        parseFloat(cs.getPropertyValue("--topbar-h")) || 0

    const barH =
        parseFloat(cs.getPropertyValue("--bar-h")) || 0



    // плашка «Общий ответ» лежит под верхней строкой и закрывает карты —
    // место под неё резервируем всегда

    const answer =
        document.querySelector(".spread-answer")

    const answerTop =
        answer ? barTop + answer.offsetHeight + 12 : 0



    // плашка с вопросом и кнопка 📝 лежат над нижней панелью

    const q =
        document.querySelector(".spread-question")

    const cb =
        document.querySelector(".comment-icon-btn")

    const db =
        document.querySelector(".download-icon-btn")

    const lowH =
        q ? q.offsetHeight + 10 : 0



    const full =
        solve(answerTop, 0)

    if (full) {

        // сначала пробуем не заходить под панели; заходим, только если
        // иначе карты пришлось бы заметно уменьшить

        const levels = [
            [Math.max(answerTop, barTop), barH + lowH],
            [Math.max(answerTop, barTop / 2), barH / 2 + lowH],
        ]

        for (const [t, b] of levels) {

            const r =
                solve(t, b)

            if (r && r.iw >= full.iw * 0.88) return r

        }

        return full

    }



    // совсем тесно: берём минимальный размер, пусть чуть налезают
    // (прокрутки нет, всё остаётся на экране)

    const g =
        geometry(floor)

    const xs =
        layoutX(g)
        || pts.map(p => padX + g.boxW / 2 + (p.x / spreadWidth) * (vw - padX * 2 - g.boxW))

    return build(g, xs, 0, vh, 0)

}



// ==========================================
// Общая картина расклада (встроенный разбор по правилам)
// Тексты фраз — в overview.json
// ==========================================
function ovFill(tpl, vars) {
    return tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ""))
}

// Стихии старших арканов (традиция Золотой Зари: планеты и знаки зодиака)
const MAJOR_ELEMENT = {
    0: "air", 1: "air", 2: "water", 3: "earth", 4: "fire", 5: "earth", 6: "air",
    7: "water", 8: "fire", 9: "earth", 10: "fire", 11: "air", 12: "water",
    13: "water", 14: "fire", 15: "earth", 16: "fire", 17: "air", 18: "water",
    19: "fire", 20: "fire", 21: "earth",
}
const SUIT_ELEMENT = { wands: "fire", cups: "water", swords: "air", pentacles: "earth" }

// Сведение числа к одной цифре (11 и 22 оставляем как «главные числа»)
function numReduce(x) {
    x = Number(x)
    for (let k = 0; k < 6 && x > 9 && x !== 11 && x !== 22; k++) {
        x = String(Math.floor(x)).split("").reduce((a, d) => a + Number(d), 0)
    }
    return x
}

function overviewDataRaw(items) {
    if (!items || items.length < 3) return null

    const T = overviewTexts
    const n = items.length
    const majors = items.filter(i => i.card.arcana === "major")
    const minors = items.filter(i => i.card.arcana !== "major")
    const reversed = items.filter(i => i.isReversed)
    const suitCount = { wands: 0, cups: 0, swords: 0, pentacles: 0 }
    minors.forEach(i => { if (suitCount[i.card.suit] !== undefined) suitCount[i.card.suit]++ })

    const courts = minors.filter(i => i.card.number >= 11)
    const aces = minors.filter(i => i.card.number === 1)
    const tens = minors.filter(i => i.card.number === 10)

    const lines = []
    const add = (tpl, vars) => lines.push(ovFill(tpl, vars))
    const ctx = {}   // выводы для «Совета расклада»

    // 1. Старшие арканы — масштаб вопроса
    if (majors.length === 0) add(T.majors.none, {})
    else if (majors.length / n >= 0.5) add(T.majors.many, { n: majors.length, total: n })
    else if (majors.length === 1) add(T.majors.one, { card: majors[0].card.name })
    else add(T.majors.some, { n: majors.length, total: n })

    // 2. Масти
    const ranked = Object.entries(suitCount).sort((a, b) => b[1] - a[1])
    const [topSuit, topCnt] = ranked[0]
    const second = ranked[1][1]
    if (minors.length >= 3 && topCnt >= 2 && topCnt > second) {
        add(T.suit.dominant, { suit: T.suits[topSuit].name, n: topCnt, theme: T.suits[topSuit].theme })
    } else if (minors.length >= 4 && topCnt === second && topCnt >= 2) {
        const tie = ranked.filter(r => r[1] === topCnt).map(r => T.suits[r[0]].name)
        add(T.suit.tie, { suits: tie.join(t(" и ")) })
    }
    if (n >= 5 && minors.length >= 4) {
        const lacking = ranked.filter(r => r[1] === 0).map(r => r[0])
        if (lacking.length === 1) {
            ctx.lackSuit = lacking[0]
            add(T.suit.lacking, { suit_gen: T.suits[lacking[0]].gen, lack: T.suits[lacking[0]].lack })
        }
    }

    // 2б. Стихии (масть младших + традиционная стихия старших) — работают в раскладах от 3 карт
    if (T.elements) try {
        const elCount = { fire: 0, water: 0, air: 0, earth: 0 }
        items.forEach(i => {
            const e = i.card.arcana === "major" ? MAJOR_ELEMENT[i.card.number] : SUIT_ELEMENT[i.card.suit]
            if (e) elCount[e]++
        })
        const elRanked = Object.entries(elCount).sort((a, b) => b[1] - a[1])
        const present = elRanked.filter(r => r[1] > 0)
        const top = elRanked[0], sec = elRanked[1]
        const minTop = n >= 4 ? Math.max(2, Math.ceil(n * 0.4)) : 2
        const lowNames = list => list.map(r => T.elements.names[r[0]].toLowerCase())
        if (top[1] >= minTop && top[1] > sec[1]) {
            add(T.elements.dominant, { el: T.elements.names[top[0]], n: top[1], total: n, theme: T.elements.theme[top[0]] })
        } else if (top[1] >= 2 && top[1] === sec[1] && T.elements.tie) {
            const tl = lowNames(elRanked.filter(r => r[1] === top[1]))
            add(T.elements.tie, { list: tl.length > 2 ? tl.slice(0, -1).join(", ") + t(" и ") + tl[tl.length - 1] : tl.join(t(" и ")) })
        } else if (present.length >= 2 && T.elements.balanced) {
            add(T.elements.balanced, { list: lowNames(present).join(", ") })
        }
        if (n >= 5) {
            const absent = elRanked.filter(r => r[1] === 0).map(r => r[0])
            if (absent.length === 1 && !(ctx.lackSuit && SUIT_ELEMENT[ctx.lackSuit] === absent[0])) {
                add(T.elements.missing, { el_gen: T.elements.genitive[absent[0]], lack: T.elements.lack[absent[0]] })
            }
        }
        // взаимодействие стихий: в больших раскладах — по две карты каждой,
        // в малых — когда в раскладе ровно две стихии
        const has = (a, b) => n >= 5
            ? (elCount[a] >= 2 && elCount[b] >= 2)
            : (elCount[a] >= 1 && elCount[b] >= 1 && present.length === 2)
        if (has("fire", "water")) { ctx.conflict = true; add(T.elements.conflict.fire_water, {}) }
        else if (has("air", "earth")) { ctx.conflict = true; add(T.elements.conflict.air_earth, {}) }
        else if (has("fire", "air")) { ctx.harmony = true; add(T.elements.harmony.fire_air, {}) }
        else if (has("water", "earth")) { ctx.harmony = true; add(T.elements.harmony.water_earth, {}) }
        else if (T.elements.pair && has("fire", "earth")) add(T.elements.pair.fire_earth, {})
        else if (T.elements.pair && has("water", "air")) add(T.elements.pair.water_air, {})
    } catch (e) { console.error("overview/elements:", e) }

    // 3. Перевёрнутые
    const rr = reversed.length / n
    const rv = { n: reversed.length, total: n }
    if (reversed.length === 0) add(T.reversed.none, rv)
    else if (rr >= 0.6) add(T.reversed.many, rv)
    else if (rr <= 0.25) add(T.reversed.few, rv)
    else add(T.reversed.mixed, rv)

    // 4. Люди, начала, завершения
    if (courts.length >= 2) add(T.courts.many, { n: courts.length, cards: courts.map(i => i.card.name).join(", ") })
    else if (courts.length === 1) add(T.courts.one, { card: courts[0].card.name })
    if (aces.length > 1) add(T.aces.many, {})
    else if (aces.length === 1) add(T.aces.one, { card: aces[0].card.name })
    if (tens.length > 1) add(T.tens.many, {})
    else if (tens.length === 1) add(T.tens.one, { card: tens[0].card.name })

    // 4а. Позиции: что означают ключевые места расклада и какие карты в них выпали
    if (T.positions) try {
        const named = items.filter(i => i.position && i.position.name)
        const used = new Set()
        const found = []
        const kwOf = it => {
            const k = Array.isArray(it.card.keywords) ? it.card.keywords.slice(0, 3).join(", ").toLowerCase() : ""
            return k ? ": " + k : ""
        }
        for (const role of T.positions.roles) {
            if (found.length >= (T.positions.max || 3)) break
            const re = new RegExp(role.match)
            const it = named.find(x => !used.has(x) && re.test(String(x.position.name).toLowerCase()))
            if (it) { used.add(it); found.push({ role, it }) }
        }
        found.sort((a, b) => named.indexOf(a.it) - named.indexOf(b.it))
        found.forEach(({ role, it }) => {
            add(it.isReversed ? role.rev : role.up, { pos: it.position.name, card: it.card.name, kw: kwOf(it) })
            if (role.key === "outcome") ctx.outcome = { rev: !!it.isReversed }
            if (role.key === "obstacle") ctx.obstacle = { rev: !!it.isReversed }
        })
        if (found.length < 2 && named.length >= 2 && T.positions.arc) {
            const f = named[0], l = named[named.length - 1]
            add(T.positions.arc, { first: f.position.name, card1: f.card.name, last: l.position.name, card2: l.card.name })
        }
    } catch (e) { console.error("overview/positions:", e) }

    // 4б. Нумерология: числа старших арканов и младших от туза до десятки (придворные не считаются)
    if (T.numerology) try {
        const numOf = i => {
            const x = Number(i.card.number)
            if (i.card.arcana === "major") return x > 0 ? x : 0
            if (x >= 1 && x <= 10) return x
            if (x >= 11 && x <= 14) return x - 9   // Паж 2, Рыцарь 3, Королева 4, Король 5
            return 0
        }
        const numCards = items.filter(i => numOf(i) > 0)
        if (numCards.length >= 2) {
            const raw = numCards.reduce((a, i) => a + numOf(i), 0)
            const r = numReduce(raw)
            ctx.num = r
            if (T.numerology.meanings[r]) {
                add(T.numerology.sum, {
                    sum: r,
                    via: raw !== r ? ovFill(T.numerology.via, { raw, r }) : "",
                    meaning: T.numerology.meanings[r],
                })
            }
            const byDigit = {}
            numCards.forEach(i => {
                const d = numReduce(numOf(i))
                const key = d > 9 ? numReduce(String(d).split("").reduce((a, c) => a + Number(c), 0)) : d
                byDigit[key] = (byDigit[key] || 0) + 1
            })
            const rep = Object.entries(byDigit).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]
            if (rep && rep[1] >= 2 && T.numerology.meanings[rep[0]]) {
                add(T.numerology.repeat, { num: rep[0], k_cards: rep[1] + ((rep[1] % 10 >= 2 && rep[1] % 10 <= 4 && (rep[1] < 12 || rep[1] > 14)) ? " карты" : " карт"), meaning: T.numerology.meanings[rep[0]] })
            }
        }
    } catch (e) { console.error("overview/numerology:", e) }

    // 5. Совет расклада — составной: темп + фокус + 1–2 нюанса, варианты текста выбираются
    // по самим картам (для одного и того же расклада совет всегда одинаков)
    const tempo = reversed.length === 0 || rr <= 0.25 ? "open" : rr >= 0.6 ? "slow" : "mixed"
    let focus = "balanced"
    if (minors.length >= 2 && topCnt >= 2 && topCnt > second) focus = topSuit
    else if (majors.length / n >= 0.5) focus = "majors"
    const seed = items.reduce((a, i, k) =>
        a + (Number(i.card.id) || String(i.card.name || "").length) * (k + 1) + (i.isReversed ? 7 : 0), 0) + n
    const pick = (v, salt) => Array.isArray(v) ? v[(seed + (salt || 0)) % v.length] : v
    const parts = [pick(T.advice.tempo[tempo], 0), pick(T.advice.focus[focus], 1)]
    try {
        const N = T.advice.nuance
        if (N) {
            const c = []
            if (ctx.outcome) c.push(pick(ctx.outcome.rev ? N.outcome_rev : N.outcome_up, 2))
            if (ctx.obstacle) c.push(pick(ctx.obstacle.rev ? N.obstacle_rev : N.obstacle_up, 3))
            if (ctx.conflict) c.push(N.conflict)
            if (ctx.harmony) c.push(N.harmony)
            if (ctx.lackSuit && N.lack_suit) c.push(N.lack_suit[ctx.lackSuit])
            if (courts.length >= 2) c.push(N.courts)
            if (aces.length) c.push(N.aces)
            if (tens.length) c.push(N.tens)
            if (majors.length / n >= 0.5) c.push(N.majors_many)
            if (ctx.num && T.numerology && T.numerology.advice) c.push(T.numerology.advice[ctx.num])
            const list = c.filter(Boolean)
            if (list.length) {
                const a = list[seed % list.length]
                parts.push(a)
                if (list.length > 1) {
                    const b = list[(seed + 1 + (Math.floor(seed / list.length) % (list.length - 1))) % list.length]
                    if (b !== a) parts.push(b)
                }
            }
        }
    } catch (e) { console.error("overview/advice:", e) }
    const advice = parts.join(" ")

    const chips = [
        ovFill(T.chips.majors, { n: majors.length }),
        ...Object.entries(suitCount).filter(r => r[1] > 0).map(r => `${T.suits[r[0]].name}: ${r[1]}`),
        ovFill(T.chips.reversed, { n: reversed.length }),
    ]

    return {
        title: T.title,
        chips,
        lines,
        adviceTitle: T.advice.title,
        advice,
    }
}

// «Общая картина» — только дополнение: любая ошибка в ней не должна ломать расклад
function overviewData(items) {
    try {
        return overviewDataRaw(items)
    } catch (e) {
        console.error("overview:", e)
        return null
    }
}

function buildOverview(items) {
    const o = overviewData(items)
    if (!o) return ""

    return `
        <div class="interpretation-item overview">
            <div class="interpretation-position">${o.title}</div>
            <div class="overview-chips">
                ${o.chips.map(c => `<span>${c}</span>`).join("")}
            </div>
            <ul class="overview-list">
                ${o.lines.map(l => `<li>${l}</li>`).join("")}
            </ul>
            <div class="overview-final">
                <b>${o.adviceTitle}.</b> ${o.advice}
            </div>
        </div>
    `
}

function renderSpread(data, question) {

    let currentComment = ""

    result.innerHTML = `
 
    ${question ? `
 
        <div class="spread-question">
 
            «${question}»
 
        </div>
 
    ` : ""}
 
 
 
    ${data.quickAnswer ? `
 
        <div class="spread-answer ${answerClass(data.quickAnswer)}">
 
            <span class="spread-answer-label">${t("Общий ответ:")}</span>
 
            <span class="spread-answer-value">${t(data.quickAnswer)}</span>
 
        </div>
 
    ` : ""}
 
 
 
    ${data.historyId ? `
 
        <button
 
            class="comment-icon-btn"
 
            data-history-id="${data.historyId}"
 
            title="${t("Добавить комментарий")}"
 
        >
 
            📝
 
        </button>
 
        <button class="download-icon-btn" data-history-id="${data.historyId}" title="${t("Скачать картинкой")}">⬇</button>
 
 
    ` : ""}
 
 
 
    <div class="spread-area" data-topbar="${data.spread.name || ""}"><div class="spread-canvas"></div></div>
 
`




    updateChrome()



    const area =
        document.querySelector(".spread-canvas")



    const spreadWidth =
        data.spread.width || 100



    const spreadHeight =
        data.spread.height || 100



    const margin = 12



    // на телефоне положение карт считает fitSpreadToViewport (pos[i]),
    // на десктопе — проценты от размера области с полями margin

    const mobilePts =
        mobileSpreadPoints(data, spreadWidth, spreadHeight)

    let layoutPos = null



    function normalize(x, y, i) {

        if (layoutPos) {

            return {
                left: layoutPos[i].left,
                top: layoutPos[i].top,
            }

        }

        const nx =
            (x / spreadWidth) * 100

        const ny =
            (y / spreadHeight) * 100

        return {

            left: margin + (nx * (100 - margin * 2)) / 100,

            top: margin + (ny * (100 - margin * 2)) / 100,

        }

    }



    const count =
        data.cards.length



    const scale =
        count <= 3 ? 1
            : count <= 6 ? 0.8
                : count <= 7 ? 0.65
                    : 0.55



    const fit =
        fitSpreadToViewport(
            area,
            mobilePts,
            spreadWidth,
            spreadHeight,
            margin,
            scale
        )



    layoutPos = fit.pos



    area.style.setProperty(
        "--card-scale",
        fit.scale
    )




    const placed = []



    data.cards.forEach(
        (item, index) => {


            const p =
                item.position





            const cardRotation =
                p.rotation || 0


            const pos =
                normalize(p.x, p.y, index)



            const card =
                document.createElement("div")



            card.className =
                "spread-card"



            card.innerHTML = `
 
 
                ${p.name ? `<div class="position-name">${p.name}</div>` : ""}
 
 
 
                <img
 
                    class="card-image ${item.isReversed ? "reversed" : ""}"
 
                    src="/${item.card.image}"
 
                >
 
 
 
                <div class="card-name">
 
                    ${item.card.name}${item.isReversed ? t(" (п.)") : ""}
 
                </div>
 
 
            `

            card.onclick =
                () => openCardModal(item)



            card.style.cursor =
                "pointer"



            card.style.left =
                pos.left + "%"



            card.style.top =
                pos.top + "%"



            card.style.transform = `
 
                translate(-50%, -50%)
 
                scale(.3)
 
                rotate(${cardRotation}deg)
 
            `





            area.appendChild(card)



            placed.push({ el: card, index })







            setTimeout(() => {


                card.style.transform = `
 
                    translate(-50%, -50%)
 
                    scale(1)
 
                    rotate(${cardRotation}deg)
 
                `




                card.style.opacity =
                    "1"



            },

                200 + index * 170)




        }

    )



    // пересчёт размера холста и позиций карт без перерисовки расклада

    currentSpreadRelayout = () => {

        if (!area.isConnected) return



        const f =
            fitSpreadToViewport(
                area,
                mobilePts,
                spreadWidth,
                spreadHeight,
                margin,
                scale
            )



        layoutPos = f.pos



        area.style.setProperty("--card-scale", f.scale)



        placed.forEach(({ el, index }) => {

            const p =
                data.cards[index].position

            const pos =
                normalize(p.x, p.y, index)



            el.style.left =
                pos.left + "%"



            el.style.top =
                pos.top + "%"

        })

    }



    const interpretationHTML =
        buildOverview(data.cards) +
        data.cards.map(item => {

            const m =
                item.isReversed
                    ? item.card.reversed
                    : item.card.upright

            return `
 
                <div class="interpretation-item">
 
                    <div class="interpretation-position">
 
                        ${item.position.name}
 
                    </div>
 
 
 
                    <div class="interpretation-card">
 
                        ${item.card.name}${item.isReversed ? t(" (перевёрнутая)") : ""}
 
                    </div>
 
 
 
                    <div class="interpretation-advice">
 
                        ${m.advice}
 
                    </div>
 
                </div>
 
            `

        }).join("")



    setInterpretation(interpretationHTML)


    const commentBtn =
        result.querySelector(".comment-icon-btn")



    if (commentBtn) {

        commentBtn.onclick = () => {

            openCommentModal(
                Number(commentBtn.dataset.historyId),
                currentComment,
                (savedText) => {

                    currentComment = savedText

                }
            )

        }

    }


}


// ==========================================
// История — иконка типа записи
// ==========================================


function historyTypeIcon(type) {

    switch (type) {

        case "daily":
            return "☀"

        case "spread":
            return "◈"

        default:
            return "🂠"

    }

}



function formatHistoryDate(dateStr) {

    const d =
        new Date(dateStr)



    return d.toLocaleString("ru-RU", {

        day: "2-digit",

        month: "2-digit",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",

    })

}


// ==========================================
// История — список
// ==========================================

async function showHistoryList() {


    try {


        setInterpretation(`
 
            <div class="interpretation-item">
 
                <div class="interpretation-advice">
 
                    ${t("Выберите карту или расклад, чтобы увидеть толкование.")}
 
                </div>
 
            </div>
 
        `)



        const records =
            await GetHistory()



        const sorted =
            [...records].reverse()


        if (sorted.length === 0) {

            result.innerHTML = `
 
        <div class="history-empty">
 
 
            <h2 class="history-title">
 
                ${t("✦ История гаданий ✦")}
 
            </h2>
 
 
 
            <p class="welcome-text">
 
                ${t("История пока пуста")}
 
            </p>
 
 
        </div>
 
    `



            return

        }


        result.innerHTML = `
 
    <div class="history-list">
 
 
        <h2 class="history-title">
 
            ${t("✦ История гаданий ✦")}
 
        </h2>
 
 
 
        <div class="history-header">
 
 
            <span class="history-count">${t("Записей: {n}", { n: sorted.length })}</span>
 
 
 
            <button id="clear-history" class="history-clear-btn">
 
                ${t("Очистить всё")}
 
            </button>
 
 
        </div>
 
 
 
                ${sorted.map(r => `
 
                    <div class="history-item" data-id="${r.id}">
 
                        <div class="history-item-main">
 
                            <span class="history-icon">${historyTypeIcon(r.type)}</span>
 
 
 
                            <div class="history-item-text">
 
                                <div class="history-item-name">${r.name}</div>
 
                                <div class="history-item-date">${formatHistoryDate(r.date)}</div>
 
                            </div>
 
                        </div>
 
 
 
                        <div class="history-actions">
 
                            <button class="history-download" data-id="${r.id}" title="${t("Скачать картинкой")}">
 
                                ⬇
 
                            </button>
 
                            <button class="history-delete" data-id="${r.id}" title="${t("Удалить")}">
 
                                ✕
 
                            </button>
 
                        </div>
 
                    </div>
 
                `).join("")}
 
            </div>
 
        `



        result.querySelectorAll(".history-item-main").forEach(el => {

            el.onclick = () => {

                const id =
                    Number(el.closest(".history-item").dataset.id)



                const record =
                    sorted.find(r => r.id === id)



                if (record) openHistoryRecord(record)

            }

        })



        result.querySelectorAll(".history-download").forEach(btn => {

            btn.onclick = (e) => {

                e.stopPropagation()

                const record =
                    sorted.find(r => r.id === Number(btn.dataset.id))

                if (record) downloadRecordImage(record)

            }

        })



        result.querySelectorAll(".history-delete").forEach(btn => {

            btn.onclick = async (e) => {

                e.stopPropagation()



                const id =
                    Number(btn.dataset.id)



                try {

                    await DeleteHistoryRecord(id)



                    showHistoryList()



                }

                catch (err) {

                    console.error(err)

                }

            }

        })


        document
            .querySelector("#clear-history")
            .onclick = () => {

                showConfirm(
                    t("Удалить всю историю гаданий без возможности восстановления?"),

                    async () => {

                        try {

                            await ClearHistory()



                            showHistoryList()



                            showToast("История очищена")



                        }

                        catch (err) {

                            console.error(err)

                        }

                    }
                )

            }


    }


    catch (e) {


        console.error(e)



        showMessage(t("Ошибка загрузки истории"))


    }


}



// ==========================================
// История — открыть конкретную запись
// ==========================================


function backToHistoryButton() {

    return `
 
        <button class="back-to-history" id="back-to-history">
 
            ${t("← К истории")}
 
        </button>
 
    `

}

function openHistoryRecord(record) {


    if (record.type === "single") {


        showCard({ ...record.cards[0], historyId: record.id })



        result.insertAdjacentHTML(
            "afterbegin",
            backToHistoryButton()
        )



        rebindCommentButton(record)


    }

    else if (record.type === "daily") {


        showDailyCard({ card: { ...record.cards[0], historyId: record.id } })



        result.insertAdjacentHTML(
            "afterbegin",
            backToHistoryButton()
        )

        rebindCommentButton(record)


    }

    else if (record.type === "spread") {


        console.log("record.spreadId:", JSON.stringify(record.spreadId))

        console.log("available keys:", Object.keys(spreadsById))

        console.log("full record:", record)



        const spreadDef =
            spreadsById[record.spreadId]



        if (!spreadDef) {

            showMessage(t("Данные расклада недоступны"))

            return

        }

        const data = {

            spread: spreadDef,

            cards: record.cards.map((card, i) => ({

                position: spreadDef.positions[i],

                card: card.card,

                isReversed: card.isReversed,

                quickAnswer: card.quickAnswer,

            })),

        }

        data.historyId = record.id



        renderSpread(data, record.question)



        result.insertAdjacentHTML(
            "afterbegin",
            backToHistoryButton()
        )

        rebindCommentButton(record)


    }

    const backBtn =
        document.querySelector("#back-to-history")



    if (backBtn) {

        backBtn.onclick = () => showHistoryList()

    }


}


// ==========================================
// Скачивание записи истории в виде картинки (PNG)
// ==========================================
//
// Картинка рисуется на canvas: заголовок, дата, вопрос, расклад
// с картами, общий ответ, толкование и комментарий. Сохранение:
//  1) на компьютере — Go-метод SaveImage кладёт файл в «Загрузки»;
//  2) на телефоне — системное меню «Поделиться» (там можно сохранить
//     в «Файлы», Google Диск, отправить в мессенджер);
//  3) запасной вариант — картинка на экране с кнопкой «Скачать».


function loadImageSafe(src, timeout = 5000) {

    return new Promise(resolve => {

        const img = new Image()

        let done = false

        const finish = ok => {

            if (done) return

            done = true

            resolve(ok ? img : null)

        }

        img.onload = () => finish(true)

        img.onerror = () => finish(false)

        setTimeout(() => finish(false), timeout)

        img.src = src

    })

}



function exportRoundRect(ctx, x, y, w, h, r) {

    r = Math.min(r, w / 2, h / 2)

    ctx.beginPath()

    ctx.moveTo(x + r, y)

    ctx.arcTo(x + w, y, x + w, y + h, r)

    ctx.arcTo(x + w, y + h, x, y + h, r)

    ctx.arcTo(x, y + h, x, y, r)

    ctx.arcTo(x, y, x + w, y, r)

    ctx.closePath()

}



function exportWrap(ctx, text, maxW) {

    const out = []

    String(text || "").split("\n").forEach(par => {

        const words = par.split(/\s+/).filter(Boolean)

        if (!words.length) {

            out.push("")

            return

        }

        let line = ""

        words.forEach(w => {

            const t = line ? line + " " + w : w

            if (!line || ctx.measureText(t).width <= maxW) line = t

            else {

                out.push(line)

                line = w

            }

        })

        if (line) out.push(line)

    })

    return out

}



// подбор размера карт и их центров (в пикселях области AW × AH)

function exportSpreadLayout(spreadDef, items, AW, ratio) {

    const sw = spreadDef.width || 100

    const sh = spreadDef.height || 100

    const pts =
        mobileSpreadPoints(
            { cards: items.map(it => ({ position: it.position })) },
            sw, sh, true
        )

    const cross =
        pts.map(p => isCrossRotation(p.rotation))

    const n = pts.length



    function place(iw, AH) {

        const bw = iw * 1.12 + 14

        const bh = iw * ratio + 116

        const padX = bw / 2 + 14

        const padY = bh / 2 + 14

        if (AH < bh + 28 || AW < bw + 28) return null

        const pos =
            pts.map(p => ({
                x: n === 1 ? AW / 2 : padX + (p.x / sw) * (AW - 2 * padX),
                y: n === 1 ? AH / 2 : padY + (p.y / sh) * (AH - 2 * padY),
            }))

        for (let i = 0; i < n; i++) {

            for (let j = i + 1; j < n; j++) {

                const d =
                    Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y)

                if ((cross[i] || cross[j]) && d < iw * 0.5) continue

                const wi = cross[i] ? iw * ratio + 8 : bw

                const hi = cross[i] ? iw + 8 : bh

                const wj = cross[j] ? iw * ratio + 8 : bw

                const hj = cross[j] ? iw + 8 : bh

                if (
                    Math.abs(pos[i].x - pos[j].x) < (wi + wj) / 2 &&
                    Math.abs(pos[i].y - pos[j].y) < (hi + hj) / 2
                ) return null

            }

        }

        return pos

    }



    if (n === 1) {

        const iw = 320

        return { iw, AH: Math.round(iw * ratio + 150), pos: place(iw, iw * ratio + 150) }

    }

    const cands = []

    for (let AH = 500; AH <= 2400; AH += 50) {

        for (let iw = 300; iw >= 60; iw -= 4) {

            const pos = place(iw, AH)

            if (pos) {

                cands.push({ iw, AH, pos })

                break

            }

        }

    }

    if (!cands.length) {

        const iw = 60, AH = 2400

        return { iw, AH, pos: place(iw, AH) || pts.map(p => ({ x: (p.x / sw) * AW, y: (p.y / sh) * AH })) }

    }

    const maxIw = Math.max(...cands.map(c => c.iw))

    return cands.find(c => c.iw >= maxIw * 0.92)

}



async function renderRecordImage(record, onStage) {

    const W = 1080

    const PAD = 56

    const FONT = '"Segoe UI", Arial, sans-serif'

    const GOLD = "#e2b94f"

    const TEXT = "#ece4f6"

    const MUTED = "#b4a8cc"



    const spreadDef =
        record.type === "spread" ? spreadsById[record.spreadId] : null

    const items =
        record.cards.map((c, i) => ({

            card: c.card,

            isReversed: !!c.isReversed,

            quickAnswer: c.quickAnswer,

            position:
                spreadDef
                    ? (spreadDef.positions[i] || {})
                    : (c.position || {}),

        }))

    const imgs =
        await Promise.all(
            items.map(it => loadImageSafe("/" + it.card.image))
        )

    const firstImg = imgs.find(Boolean)

    const ratio =
        firstImg && firstImg.naturalWidth
            ? firstImg.naturalHeight / firstImg.naturalWidth
            : 1.75

    const title =
        record.name ||
        (record.type === "daily" ? t("Карта дня")
            : record.type === "spread" ? t("Расклад") : t("Карта"))

    const quick =
        record.quickAnswer ||
        (record.type !== "spread" && items[0] ? items[0].quickAnswer : "")

    const ov = spreadDef ? overviewData(items) : null

    const layout =
        spreadDef && items.length > 1
            ? exportSpreadLayout(spreadDef, items, W - 2 * PAD, ratio)
            : null



    // run(ctx, draw): считает высоту; при draw=true ещё и рисует
    const marks = {}

    // stage: 0 силуэты, 1 фон и рамка, 2 заголовок, 3 карты, 4 толкование,
    // 5 комментарий и подпись (99 — всё сразу)

    function run(ctx, D, stage = 99) {

        let draw = D && stage >= 2

        let cardsPhase = false

        const sil = stage < 3

        let y = PAD

        const innerW = W - 2 * PAD

        const text = (str, x, yy, font, color, align = "left") => {

            if (!draw || (cardsPhase && sil)) return

            ctx.font = font

            ctx.fillStyle = color

            ctx.textAlign = align

            ctx.textBaseline = "alphabetic"

            ctx.fillText(str, x, yy)

        }

        const para = (str, x, font, color, lh, maxW, align = "left") => {

            ctx.font = font

            const lines = exportWrap(ctx, str, maxW)

            lines.forEach((ln, i) => text(ln, x, y + lh * (i + 0.8), font, color, align))

            y += lines.length * lh

        }

        const rule = () => {

            if (draw) {

                ctx.strokeStyle = "rgba(226,185,79,.35)"

                ctx.lineWidth = 2

                ctx.beginPath()

                ctx.moveTo(PAD, y)

                ctx.lineTo(W - PAD, y)

                ctx.stroke()

            }

            y += 34

        }



        text("✦  Tarot Oracle  ✦", W / 2, y + 28, `600 28px ${FONT}`, "rgba(226,185,79,.75)", "center")

        y += 64

        para(title, W / 2, `700 56px ${FONT}`, GOLD, 66, innerW, "center")

        y += 8

        text(formatHistoryDate(record.date), W / 2, y + 26, `400 28px ${FONT}`, MUTED, "center")

        y += 52

        if (record.question) {

            ctx.font = `italic 400 32px ${FONT}`

            para("«" + record.question + "»", W / 2, `italic 400 32px ${FONT}`, TEXT, 44, innerW - 40, "center")

            y += 10

        }

        if (quick) {

            ctx.font = `700 34px ${FONT}`

            const label = t("Общий ответ:") + " " + t(quick)

            const tw = ctx.measureText(label).width + 56

            const positive = /^(скорее )?да/i.test(quick)

            const negative = /^(скорее )?нет/i.test(quick)

            if (draw) {

                exportRoundRect(ctx, (W - tw) / 2, y, tw, 64, 32)

                ctx.fillStyle = positive ? "rgba(90,200,130,.22)" : negative ? "rgba(220,90,90,.22)" : "rgba(226,185,79,.18)"

                ctx.fill()

                ctx.strokeStyle = positive ? "#5ac882" : negative ? "#dc5a5a" : GOLD

                ctx.lineWidth = 2

                ctx.stroke()

            }

            text(label, W / 2, y + 43, `700 34px ${FONT}`, positive ? "#8ee6ad" : negative ? "#ff9a9a" : GOLD, "center")

            y += 64 + 20

        }

        y += 6

        rule()



        // ---- карты ----

        marks.cards = y

        draw = D

        cardsPhase = true

        const drawCard = (it, img, cx, cy, iw, withLabels) => {

            const ih = iw * ratio

            if (!draw) return

            if (sil) {

                // силуэт будущей карты

                ctx.save()

                ctx.translate(cx, cy)

                ctx.rotate(((it.position.rotation || 0) * Math.PI) / 180)

                exportRoundRect(ctx, -iw / 2, -ih / 2, iw, ih, iw * 0.06)

                ctx.fillStyle = "rgba(255,255,255,.035)"

                ctx.fill()

                ctx.setLineDash([10, 8])

                ctx.strokeStyle = "rgba(226,185,79,.4)"

                ctx.lineWidth = 3

                ctx.stroke()

                ctx.restore()

                return

            }

            const rot = ((it.position.rotation || 0) + (it.isReversed ? 180 : 0)) * Math.PI / 180

            if (withLabels && it.position.name) {

                ctx.font = `600 ${Math.max(20, Math.round(iw * 0.115))}px ${FONT}`

                ctx.fillStyle = MUTED

                ctx.textAlign = "center"

                ctx.fillText(it.position.name, cx, cy - ih / 2 - 14)

            }

            ctx.save()

            ctx.translate(cx, cy)

            ctx.rotate(((it.position.rotation || 0) * Math.PI) / 180)

            ctx.rotate(it.isReversed ? Math.PI : 0)

            ctx.shadowColor = "rgba(226,185,79,.55)"

            ctx.shadowBlur = 28

            exportRoundRect(ctx, -iw / 2, -ih / 2, iw, ih, iw * 0.06)

            ctx.fillStyle = "#4a3475"

            ctx.fill()

            ctx.shadowBlur = 0

            ctx.save()

            exportRoundRect(ctx, -iw / 2, -ih / 2, iw, ih, iw * 0.06)

            ctx.clip()

            if (img) ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih)

            ctx.restore()

            exportRoundRect(ctx, -iw / 2, -ih / 2, iw, ih, iw * 0.06)

            ctx.strokeStyle = "rgba(226,185,79,.85)"

            ctx.lineWidth = 3

            ctx.stroke()

            ctx.restore()

            if (withLabels) {

                const nm = it.card.name + (it.isReversed ? t(" (п.)") : "")

                const fs = Math.max(20, Math.round(iw * 0.105))

                ctx.font = `500 ${fs}px ${FONT}`

                ctx.fillStyle = TEXT

                ctx.textAlign = "center"

                const lines = exportWrap(ctx, nm, iw * 1.2 + 10)

                lines.slice(0, 3).forEach((ln, k) => ctx.fillText(ln, cx, cy + ih / 2 + fs * 1.3 + k * fs * 1.2))

            }

        }

        if (layout) {

            if (draw) {

                items.forEach((it, i) => {

                    const isCross = isCrossRotation(it.position.rotation)

                    drawCard(it, imgs[i], PAD + layout.pos[i].x, y + layout.pos[i].y, layout.iw, !isCross)

                })

            }

            y += layout.AH + 10

        } else if (items[0]) {

            const iw = 320

            const ih = iw * ratio

            const cx = W / 2

            drawCard(items[0], imgs[0], cx, y + ih / 2 + 8, iw, false)

            y += ih + 30

            const nm = items[0].card.name + (items[0].isReversed ? t(" (перевёрнутая)") : "")

            ctx.font = `700 44px ${FONT}`

            para(nm, W / 2, `700 44px ${FONT}`, GOLD, 54, innerW, "center")

            y += 8

        }

        cardsPhase = false

        draw = D && stage >= 4

        rule()



        // ---- толкование ----

        marks.interp = y

        if (ov) {

            text(ov.title, PAD, y + 34, `700 38px ${FONT}`, GOLD)

            y += 64

            const TX = PAD + 30

            const ops = []

            let oy = 20

            const put = (str, font, color, lh, x, maxW) => {

                ctx.font = font

                exportWrap(ctx, str, maxW).forEach((ln, k) => ops.push({ ln, font, color, x, y: oy + lh * (k + 0.8) }))

                oy += exportWrap(ctx, str, maxW).length * lh

            }

            put(ov.chips.join("  ·  "), `600 25px ${FONT}`, MUTED, 34, TX, innerW - 60)

            oy += 12

            ov.lines.forEach(l => {

                ctx.font = `400 29px ${FONT}`

                const wl = exportWrap(ctx, l, innerW - 56 - 34)

                ops.push({ ln: "•", font: `700 29px ${FONT}`, color: GOLD, x: TX, y: oy + 41 * 0.8 })

                wl.forEach((ln, k) => ops.push({ ln, font: `400 29px ${FONT}`, color: TEXT, x: TX + 34, y: oy + 41 * (k + 0.8) }))

                oy += wl.length * 41 + 6

            })

            oy += 8

            put(`${ov.adviceTitle}. ${ov.advice}`, `italic 600 29px ${FONT}`, GOLD, 40, TX, innerW - 60)

            const oh = oy + 18

            if (draw) {

                exportRoundRect(ctx, PAD, y, innerW, oh, 18)

                ctx.fillStyle = "rgba(255,255,255,.055)"

                ctx.fill()

                ctx.fillStyle = "rgba(226,185,79,.8)"

                exportRoundRect(ctx, PAD, y, 7, oh, 3)

                ctx.fill()

            }

            ops.forEach(o => text(o.ln, o.x, y + o.y, o.font, o.color))

            y += oh + 22

        }

        text("Толкование", PAD, y + 34, `700 38px ${FONT}`, GOLD)

        y += 64

        items.forEach(it => {

            const m =
                it.isReversed ? it.card.reversed : it.card.upright

            const body =
                spreadDef
                    ? (m.advice || m.text || "")
                    : [m.text, m.advice ? t("Совет:") + " " + m.advice : ""].filter(Boolean).join("\n\n")

            const nm = it.card.name + (it.isReversed ? t(" (перевёрнутая)") : "")

            const blockTop = y

            ctx.font = `400 29px ${FONT}`

            const lines = exportWrap(ctx, body, innerW - 56)

            const h = 20 + (it.position.name ? 36 : 0) + 52 + lines.length * 41 + 18

            if (draw) {

                exportRoundRect(ctx, PAD, blockTop, innerW, h, 18)

                ctx.fillStyle = "rgba(255,255,255,.055)"

                ctx.fill()

                ctx.fillStyle = "rgba(226,185,79,.8)"

                exportRoundRect(ctx, PAD, blockTop, 7, h, 3)

                ctx.fill()

            }

            let yy = blockTop + 20

            if (it.position.name) {

                text(it.position.name.toUpperCase(), PAD + 30, yy + 24, `600 24px ${FONT}`, MUTED)

                yy += 36

            }

            text(nm, PAD + 30, yy + 32, `700 32px ${FONT}`, GOLD)

            yy += 52

            lines.forEach((ln, k) => text(ln, PAD + 30, yy + 30 + k * 41 - 8, `400 29px ${FONT}`, TEXT))

            y = blockTop + h + 16

        })



        // ---- комментарий ----

        draw = D && stage >= 5

        if (record.comment && String(record.comment).trim()) {

            y += 8

            text("Комментарий", PAD, y + 34, `700 38px ${FONT}`, GOLD)

            y += 64

            ctx.font = `italic 400 30px ${FONT}`

            const lines = exportWrap(ctx, record.comment, innerW - 56)

            const h = 36 + lines.length * 42

            if (draw) {

                exportRoundRect(ctx, PAD, y, innerW, h, 18)

                ctx.fillStyle = "rgba(226,185,79,.09)"

                ctx.fill()

                ctx.strokeStyle = "rgba(226,185,79,.4)"

                ctx.lineWidth = 2

                ctx.stroke()

            }

            lines.forEach((ln, k) => text(ln, PAD + 28, y + 18 + 31 + k * 42 - 4, `italic 400 30px ${FONT}`, TEXT))

            y += h + 20

        }

        y += 10

        text("✦ Tarot Oracle ✦", W / 2, y + 22, `500 24px ${FONT}`, "rgba(226,185,79,.55)", "center")

        y += 22 + PAD

        return y

    }



    const scratch = document.createElement("canvas").getContext("2d")

    const H = Math.ceil(run(scratch, false))

    const canvas = document.createElement("canvas")

    canvas.width = W

    canvas.height = Math.min(H, 16000)

    const ctx = canvas.getContext("2d")

    const CH = canvas.height

    const paint = (stage) => {

        ctx.clearRect(0, 0, W, CH)

        if (stage < 1) {

            ctx.fillStyle = "#09070d"

            ctx.fillRect(0, 0, W, CH)

        }

        else {

            const bg = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, Math.max(W, H))

            bg.addColorStop(0, "#3b2b57")

            bg.addColorStop(0.45, "#1b1528")

            bg.addColorStop(1, "#09070d")

            ctx.fillStyle = bg

            ctx.fillRect(0, 0, W, CH)

            ctx.strokeStyle = "rgba(226,185,79,.45)"

            ctx.lineWidth = 3

            ctx.setLineDash([])

            exportRoundRect(ctx, 14, 14, W - 28, CH - 28, 26)

            ctx.stroke()

        }

        ctx.setLineDash([])

        run(ctx, true, stage)

    }

    if (onStage) {

        for (let st = 0; st <= 5; st++) {

            paint(st)

            await onStage(st, canvas, marks)

        }

    }

    paint(99)

    return new Promise((resolve, reject) =>
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob")), "image/png")
    )

}



// Кнопка ⬇ внутри открытой карты / расклада: берём сохранённую запись
// из истории (с актуальным комментарием) и скачиваем её картинкой

result.addEventListener("click", async (e) => {

    const btn = e.target.closest(".download-icon-btn")

    if (!btn) return

    try {

        const id = Number(btn.dataset.historyId)

        const records = await GetHistory()

        const record = records.find(r => r.id === id)

        if (record) downloadRecordImage(record)

        else showToast("Запись не найдена в истории")

    }

    catch (err) {

        console.error(err)

        showToast("Не удалось создать картинку")

    }

})



function recordFileName(record) {

    const d = new Date(record.date)

    const p = n => String(n).padStart(2, "0")

    const stamp =
        isNaN(d)
            ? ""
            : `_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`

    const name =
        (record.name || "Tarot")
            .replace(/[^\p{L}\p{N}]+/gu, "_")
            .replace(/^_+|_+$/g, "")

    return `Tarot_${name}${stamp}.png`

}



function blobToBase64(blob) {

    return new Promise((resolve, reject) => {

        const r = new FileReader()

        r.onload = () => resolve(String(r.result).split(",")[1] || "")

        r.onerror = () => reject(r.error)

        r.readAsDataURL(blob)

    })

}



async function saveViaAndroid(blob, fileName) {

    try {

        if (!window.TarotNative || typeof window.TarotNative.saveImage !== "function") return false

        const res = String(window.TarotNative.saveImage(fileName, await blobToBase64(blob)))

        if (res.indexOf("ok:") === 0) {

            showToast("Сохранено в галерее: Pictures/TarotOracle")

            return true

        }

        console.warn("TarotNative:", res)

    }

    catch (e) {

        console.warn("TarotNative:", e)

    }

    return false

}



function showImagePreview(blob, fileName) {

    const url = URL.createObjectURL(blob)

    const box = document.createElement("div")

    box.className = "image-preview"

    // панель встаёт ровно на уровень верхней строки приложения («Расклады»)
    const tb = document.querySelector("#topbar")

    const r = tb ? tb.getBoundingClientRect() : null

    if (r && r.height > 0) {

        box.style.paddingTop = Math.round(r.top) + "px"

        box.style.setProperty("--preview-bar-h", Math.round(r.height) + "px")

    }

    box.innerHTML = `
 
        <div class="image-preview-bar">
 
            <button class="image-preview-btn" data-act="close" type="button">${t("Закрыть")}</button>
 
            <span class="image-preview-space"></span>
 
            <a class="image-preview-btn" data-act="save" href="${url}" download="${fileName}">${t("Скачать")}</a>
 
        </div>
 
        <div class="image-preview-scroll"><img src="${url}" alt=""></div>
 
    `

    const close = () => {

        box.remove()

        URL.revokeObjectURL(url)

    }

    box.querySelector('[data-act="close"]').addEventListener("click", close)

    const saveBtn = box.querySelector('[data-act="save"]')

    if (window.TarotNative) {

        saveBtn.addEventListener("click", async (ev) => {

            ev.preventDefault()

            await saveViaAndroid(blob, fileName)

        })

    }

    document.body.appendChild(box)

}



const RITUAL_STEPS = [
    t("Собираем ваш расклад…"),
    t("Добавляем фон и рамку…"),
    t("Пишем заголовок и вопрос…"),
    t("Подготавливаем изображения карт…"),
    t("Добавляем толкование…"),
    t("Добавляем последние штрихи…"),
    t("Сохраняем файл…"),
]

// Время (мс), которое можно регулировать:
const RITUAL_START_MS = 600    // пауза в начале, пока появляется картинка
const RITUAL_FADE_MS = 1000    // длительность плавной смены этапа
const RITUAL_STEP_MS = 1500    // сколько длится каждый этап

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function saveBlobAnywhere(blob, fileName) {

    // Android: в галерею (Pictures/TarotOracle)

    if (window.TarotNative && typeof window.TarotNative.saveImage === "function") {

        try {

            const res = String(window.TarotNative.saveImage(fileName, await blobToBase64(blob)))

            if (res.indexOf("ok:") === 0) return { ok: true, kind: "gallery", uri: res.slice(3) }

            console.warn("TarotNative:", res)

        }

        catch (e) {

            console.warn("TarotNative:", e)

        }

        return { ok: false }

    }

    // iPhone / iPad: сохранить файл напрямую нельзя —
    // картинку готовим, а сохранение идёт через «Поделиться»

    if (/iPhone|iPad|iPod/.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {

        return { ok: true, kind: "ready" }

    }

    // компьютер: Go кладёт файл в «Загрузки»

    const save = TarotApi["SaveImage"]

    if (typeof save === "function") {

        try {

            const path = await save(fileName, await blobToBase64(blob))

            return { ok: true, kind: "file", path }

        }

        catch (e) {

            console.warn("SaveImage:", e)

        }

    }

    // браузер

    try {

        const url = URL.createObjectURL(blob)

        const a = document.createElement("a")

        a.href = url

        a.download = fileName

        document.body.appendChild(a)

        a.click()

        a.remove()

        setTimeout(() => URL.revokeObjectURL(url), 4000)

        return { ok: true, kind: "browser" }

    }

    catch (e) {

        return { ok: false }

    }

}

async function shareSaved(saved, blob, fileName) {

    if (saved.uri && window.TarotNative && typeof window.TarotNative.shareImage === "function") {

        window.TarotNative.shareImage(saved.uri)

        return

    }

    const file = new File([blob], fileName, { type: "image/png" })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {

        try {

            await navigator.share({ files: [file], title: "Tarot Oracle" })

        }

        catch (e) {

            if (!e || e.name !== "AbortError") showToast("Не удалось поделиться")

        }

        return

    }

    // запасной вариант: показать картинку, её можно сохранить долгим нажатием

    showImagePreview(blob, fileName)

}

function canShareSaved(saved, blob, fileName) {

    if (saved.uri && window.TarotNative && typeof window.TarotNative.shareImage === "function") return true

    try {

        const file = new File([blob], fileName, { type: "image/png" })

        return !!(navigator.canShare && navigator.canShare({ files: [file] }))

    }

    catch (e) {

        return false

    }

}

function ritualWhere() {

    if (window.TarotNative) return t("Сохранение в галерею")

    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return t("Подготовка картинки")

    return t("Сохранение в «Загрузки»")

}

function openRitual() {

    const box = document.createElement("div")

    box.className = "ritual"

    // на Android оставляем «богатое» оформление (размытие, плавное увеличение);
    // на компьютере (WebKitGTK без видеокарты) — облегчённое

    if (window.TarotNative) box.classList.add("ritual-rich")

    box.innerHTML = `
 
        <div class="ritual-head">
 
            <div class="ritual-head-title">${t("Запечатлеваем расклад")}</div>
 
            <div class="ritual-head-sub">${ritualWhere()}</div>
 
        </div>
 
        <div class="ritual-stage"><div class="ritual-slot"></div></div>
 
        <div class="ritual-status">
 
            <div class="ritual-spinner"></div>
 
            <div class="ritual-bar"><i></i></div>
 
            <div class="ritual-label"></div>
 
        </div>
 
        <div class="ritual-done" hidden></div>
 
    `

    document.body.appendChild(box)

    requestAnimationFrame(() => box.classList.add("show"))

    const stageEl = box.querySelector(".ritual-stage")

    const slot = box.querySelector(".ritual-slot")

    const labelEl = box.querySelector(".ritual-label")

    const barEl = box.querySelector(".ritual-bar i")

    let canvasEl = null

    let labelTimer = null

    const setLabel = (text, instant) => {

        clearTimeout(labelTimer)

        const apply = () => {

            labelEl.textContent = text

            labelEl.style.opacity = "1"

        }

        if (instant) {

            labelEl.style.transition = "none"

            apply()

            void labelEl.offsetWidth

            labelEl.style.transition = ""

            return

        }

        labelEl.style.opacity = "0"

        labelTimer = setTimeout(apply, RITUAL_FADE_MS / 2)

    }

    const follow = (canvas, y) => {

        // прокручиваем картинку к месту, которое сейчас «рисуется»

        const sw = stageEl.clientWidth

        const k = sw / canvas.width

        const dispH = canvas.height * k

        const maxShift = Math.max(0, dispH - stageEl.clientHeight)

        const shift = Math.min(maxShift, Math.max(0, y * k - 24))

        slot.style.transform = `translateY(${-shift}px)`

    }

    setLabel(RITUAL_STEPS[0], true)

    let prevCanvas = null

    return {

        async stage(st, canvas, marks) {

            if (!canvasEl) {

                // на экране — уменьшенные копии (лёгкие для отрисовки),
                // полноразмерный холст остаётся за кадром

                const VW = Math.min(canvas.width, 540)

                const VH = Math.round(canvas.height * VW / canvas.width)

                slot.style.position = "relative"

                slot.style.aspectRatio = canvas.width + " / " + canvas.height

                prevCanvas = document.createElement("canvas")

                prevCanvas.width = VW

                prevCanvas.height = VH

                prevCanvas.className = "ritual-canvas ritual-prev"

                canvasEl = document.createElement("canvas")

                canvasEl.width = VW

                canvasEl.height = VH

                canvasEl.className = "ritual-canvas ritual-main"

                slot.appendChild(prevCanvas)

                slot.appendChild(canvasEl)

                canvasEl.style.opacity = "0"

                await sleep(RITUAL_START_MS)

            }

            setLabel(RITUAL_STEPS[st])

            barEl.style.width = Math.round(((st + 1) / 8) * 100) + "%"

            const target =
                st <= 2 ? 0
                    : st === 3 ? (marks.cards || 0) - 40
                        : st === 4 ? (marks.interp || 0) - 20
                            : canvas.height

            follow(canvas, target)

            // новое состояние плавно проявляется поверх предыдущего

            canvasEl.getContext("2d").drawImage(canvas, 0, 0, canvasEl.width, canvasEl.height)

            void canvasEl.offsetWidth

            canvasEl.style.transition = `opacity ${RITUAL_FADE_MS}ms ease`

            canvasEl.style.opacity = "1"

            await sleep(RITUAL_STEP_MS)

            // фиксируем кадр как «предыдущий» и прячем верхний слой
            // (без видимых изменений) до следующего шага

            prevCanvas.getContext("2d").drawImage(canvasEl, 0, 0)

            canvasEl.style.transition = "none"

            canvasEl.style.opacity = "0"

        },

        saving(text) {

            setLabel(text)

            barEl.style.width = "92%"

        },

        async finish(saved, blob, fileName) {

            barEl.style.width = "100%"

            canvasEl.style.transition = "none"

            canvasEl.style.opacity = "1"

            await sleep(350)

            slot.style.transform = "translateY(0)"

            box.classList.add("done")

            const done = box.querySelector(".ritual-done")

            let title = t("Расклад сохранён")

            let sub = ""

            if (!saved.ok) {

                title = t("Не удалось сохранить")

                sub = t("Попробуйте ещё раз")

            }

            else if (saved.kind === "gallery") {

                title = t("Расклад сохранён в галерее")

                sub = "Pictures / TarotOracle"

            }

            else if (saved.kind === "file") {

                title = t("Расклад сохранён")

                sub = t("Папка «Загрузки»")

            }

            if (saved.ok && saved.kind === "ready") {

                title = t("Картинка готова")

                sub = t("Нажмите «Поделиться» и выберите «Сохранить изображение»")

            }

            const share = saved.ok && (saved.kind === "ready" || canShareSaved(saved, blob, fileName))

            done.innerHTML = `
 
                ${saved.ok ? `
                <svg class="ritual-check" viewBox="0 0 52 52" aria-hidden="true">
                    <circle cx="26" cy="26" r="23" />
                    <path d="M15 27 L23 35 L38 18" />
                </svg>` : `<div class="ritual-fail">!</div>`}
 
                <div class="ritual-title">${title}</div>
 
                ${sub ? `<div class="ritual-sub">${sub}</div>` : ""}
 
                <div class="ritual-actions">
 
                    ${share ? `<button type="button" class="ritual-btn ghost" data-act="share">${t("Поделиться")}</button>` : ""}
 
                    <button type="button" class="ritual-btn" data-act="ok">${t("Готово")}</button>
 
                </div>
 
            `

            done.hidden = false

            requestAnimationFrame(() => done.classList.add("in"))

            done.querySelector('[data-act="ok"]').addEventListener("click", () => {

                box.classList.remove("show")

                setTimeout(() => box.remove(), 320)

            })

            const sb = done.querySelector('[data-act="share"]')

            if (sb) sb.addEventListener("click", () => shareSaved(saved, blob, fileName))

        },

        fail() {

            box.classList.remove("show")

            setTimeout(() => box.remove(), 320)

        },

    }

}

async function downloadRecordImage(record) {

    const ui = openRitual()

    try {

        const blob = await renderRecordImage(record, (st, canvas, marks) => ui.stage(st, canvas, marks))

        const fileName = recordFileName(record)

        ui.saving(window.TarotNative ? t("Сохраняем файл в галерее…") : RITUAL_STEPS[6])

        const [saved] = await Promise.all([saveBlobAnywhere(blob, fileName), sleep(700)])

        await ui.finish(saved, blob, fileName)

    }

    catch (e) {

        console.error(e)

        ui.fail()

        showToast("Не удалось создать картинку")

    }

}



// ==========================================
// Настройки
// ==========================================


const APP_INFO = {

    name: "Tarot Oracle",

    version: "1.0.0",

    description: t("Приложение для гаданий на картах Таро: расклады, карта дня и толкования."),

}

function showSettings() {


    result.innerHTML = `
 
 
        <div class="settings-screen">
 
 
            <h2 class="settings-title">
 
                ${t("✦ Настройки ✦")}
 
            </h2>
 
 
 
            <div class="settings-group">
 
 
                <div class="settings-group-title">${t("Колода")}</div>
 
 
 
                <div class="settings-options">
 
 
                    <button
 
                        class="settings-option ${appSettings.deckMode === "full" ? "active" : ""}"
 
                        data-setting="deckMode"
 
                        data-value="full"
 
                    >
 
                        ${t("Полная (78 карт)")}
 
                    </button>
 
 
 
                    <button
 
                        class="settings-option ${appSettings.deckMode === "major" ? "active" : ""}"
 
                        data-setting="deckMode"
 
                        data-value="major"
 
                    >
 
                        ${t("Старшие арканы (22)")}
 
                    </button>
 
 
                </div>
 
 
 
                <p class="settings-hint">
 
                    ${t("При смене режима колода будет пересобрана и перемешана.")}
 
                </p>
 
 
            </div>
 
            <div class="settings-group">
 
 
    <div class="settings-group-title">${t("Способ вытягивания")}</div>
 
 
 
    <div class="settings-options">
 
 
        <button
 
            class="settings-option ${appSettings.drawMode !== "random" ? "active" : ""}"
 
            data-setting="drawMode"
 
            data-value="sequential"
 
        >
 
            ${t("По порядку")}
 
        </button>
 
 
 
        <button
 
            class="settings-option ${appSettings.drawMode === "random" ? "active" : ""}"
 
            data-setting="drawMode"
 
            data-value="random"
 
        >
 
            ${t("Случайно")}
 
        </button>
 
 
    </div>
 
 
 
    <p class="settings-hint">
 
        ${t("«По порядку» — карты вытягиваются последовательно из уже перемешанной колоды. «Случайно» — каждая карта выбирается заново из оставшихся.")}
 
    </p>
 
 
</div>
 
 
 
            <div class="settings-group">
 
 
                <div class="settings-group-title">
 
                    ${t("Стиль колоды")} <span class="settings-soon">${t("Скоро")}</span>
 
                </div>
 
 
 
                <div class="settings-options">
 
 
                    <button class="settings-option active" disabled>
 
                        ${t("Классическая")}
 
                    </button>
 
 
 
                    <button class="settings-option" disabled>
 
                        ${t("Тёмная")}
 
                    </button>
 
 
 
                    <button class="settings-option" disabled>
 
                        ${t("Акварель")}
 
                    </button>
 
 
                </div>
 
 
            </div>
 
 
 
            <div class="settings-group">
 
 
                <div class="settings-group-title">
 
                    ${t("Язык")} <span class="settings-soon">${t("Скоро")}</span>
 
                </div>
 
 
 
                <div class="settings-options">
 
 
                    <button class="settings-option active" disabled>
 
                        ${t("Русский")}
 
                    </button>
 
 
 
                    <button class="settings-option" disabled>
 
                        English
 
                    </button>
 
 
                </div>
 
 
            </div>
 
 
 
            <div class="settings-group">
 
 
                <div class="settings-group-title">${t("О программе")}</div>
 
 
 
                <button class="settings-link" id="open-about">
 
                    ${APP_INFO.name} · ${t("версия")} ${APP_INFO.version}
 
                </button>
 
 
                 <button class="settings-link" id="open-guide">
 
        ${t("Руководство пользователя")}
 
    </button>
 
    <button class="settings-link" id="open-about-tarot">
 
        ${t("О картах Таро")}
 
    </button>
 
 
            </div>
 
 
 
            <div class="settings-group">
 
 
                <button class="settings-link" id="open-privacy">
 
                    ${t("Политика конфиденциальности")}
 
                </button>
 
 
 
                <button class="settings-link" id="open-terms">
 
                    ${t("Условия использования")}
 
                </button>
 
 
 
                <button class="settings-link" id="open-credits">
 
                    ${t("Источники и лицензии")}
 
                </button>
 
 
            </div>
 
 
        </div>
 
 
    `



    result.querySelectorAll(".settings-option[data-setting]").forEach(btn => {

        btn.onclick = async () => {

            const key =
                btn.dataset.setting



            const value =
                btn.dataset.value



            appSettings[key] = value



            try {

                await UpdateSetting(key, value)


                if (key === "deckMode") {

                    showToast("Колода обновлена")

                }



                showSettings()



            }

            catch (e) {

                console.error(e)

            }

        }

    })



    document
        .querySelector("#open-about")
        .onclick = () => {

            showInfoModal(

                APP_INFO.name,

                `${t("Версия")} ${APP_INFO.version}<br><br>${APP_INFO.description}`

            )

        }

    document
        .querySelector("#open-guide")
        .onclick = () => {

            showGuideScreen(
                t("✦ Руководство пользователя ✦"),
                GetGuide
            )

        }

    document
        .querySelector("#open-about-tarot")
        .onclick = () => {

            showGuideScreen(
                t("✦ О картах Таро ✦"),
                GetAboutTarot
            )

        }

    document
        .querySelector("#open-privacy")
        .onclick = async () => {

            try {

                const legal =
                    await GetLegal()



                const section =
                    legal?.privacy



                if (!section) {

                    showInfoModal(t("Политика конфиденциальности"), t("Текст пока недоступен."))



                    return

                }



                showInfoModal(

                    section.title,

                    section.paragraphs.map(p => `<p>${p}</p>`).join("")

                )


            }

            catch (e) {

                console.error(e)

            }

        }



    document
        .querySelector("#open-terms")
        .onclick = async () => {

            try {

                const legal =
                    await GetLegal()



                const section =
                    legal?.terms



                if (!section) {

                    showInfoModal(t("Условия использования"), t("Текст пока недоступен."))



                    return

                }



                showInfoModal(

                    section.title,

                    section.paragraphs.map(p => `<p>${p}</p>`).join("")

                )


            }

            catch (e) {

                console.error(e)

            }

        }


    // Источники изображений и лицензии — текст прямо здесь (не зависит от legal.json)
    const creditsBtn = document.querySelector("#open-credits")

    if (creditsBtn) creditsBtn.onclick = () => {

        showInfoModal(

            t("Источники и лицензии"),

            [
                "<p><b>" + t("Изображения карт.") + "</b> " + t("Используются иллюстрации колоды Райдера-Уэйта-Смит (1909–1910), художница — Памела Колман Смит (1878–1951). Изображения находятся в общественном достоянии (Public domain). Источник файлов — Wikimedia Commons, коллекция участника TaionWC.") + "</p>",
                "<p><b>" + t("Открытое программное обеспечение.") + "</b> " + t("Приложение создано с использованием Wails и других библиотек с открытым исходным кодом, которые распространяются под собственными лицензиями (в основном MIT).") + "</p>",
            ].join("")

        )

    }



}



function showInfoModal(title, html) {

    const modal =
        document.querySelector("#card-modal")



    const content =
        document.querySelector("#modal-content")



    content.innerHTML = `
 
 
        <button class="modal-close" id="modal-close">
 
            ✕
 
        </button>
 
 
 
        <h2 class="question-title">${title}</h2>
 
 
 
        <p class="info-modal-text">${html}</p>
 
 
    `

    modal.classList.remove("hidden")



    modal.classList.remove("opening")

    modal.classList.remove("closing")



    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            modal.classList.add("opening")

        })

    })



    document
        .querySelector("#modal-close")
        .onclick = closeCardModal

}



// ==========================================
// Очистка сцены
// ==========================================


function clearScene() {

    showWelcomeDeck()

}

// ==========================================
// Колода
// ==========================================

document
    .querySelector("#deck-info")
    .onclick = () => {

        // экран колоды уже открыт — ничего не делаем; после «✕» кнопка
        // осталась «активной», а экрана нет — тогда открываем заново
        if (
            activeButton === document.querySelector("#deck-info")
            && result.querySelector(".deck-screen")
        ) {

            return

        }



        setActive(
            document.querySelector("#deck-info")
        )

        showDeckScreen()

    }


function cardGridItemHTML(card, isReversed) {

    return `
 
        <div class="deck-card-item">
 
            <img
 
                class="deck-card-thumb ${isReversed ? "reversed" : ""}"
 
                src="/${card.image}"
 
            >
 
 
 
            <span class="deck-card-item-name">${card.name}</span>
 
        </div>
 
    `

}

async function showDeckScreen() {


    result.innerHTML = `
 
        <div class="deck-screen">
 
 
            <h2 class="deck-screen-title">
 
                ${t("✦ Колода ✦")}
 
            </h2>
 
 
            <div class="deck-tabs">
 
 
    <button class="tab-btn active" data-tab-group="deck" data-tab-key="remaining">
 
        ${t("Оставшиеся карты")}
 
        <span class="deck-group-count" id="remaining-total-count"></span>
 
    </button>
 
 
 
    <button class="tab-btn" data-tab-group="deck" data-tab-key="full">
 
        ${t("Вся колода")}
 
        <span class="deck-group-count" id="full-total-count"></span>
 
    </button>
 
 
</div>
 
 
 
            <div
 
                class="tab-panel-deck active"
 
                data-tab-group="deck"
 
                data-tab-panel="remaining"
 
            >
 
                <div class="deck-loading">${t("Загрузка...")}</div>
 
            </div>
 
 
 
            <div
 
                class="tab-panel-deck"
 
                data-tab-group="deck"
 
                data-tab-panel="full"
 
            >
 
                <div class="deck-loading">${t("Загрузка...")}</div>
 
            </div>
 
 
        </div>
 
    `



    result.querySelectorAll(".tab-btn[data-tab-group='deck']").forEach(btn => {

        btn.onclick = () => {

            result.querySelectorAll(".tab-btn[data-tab-group='deck']")
                .forEach(b => b.classList.remove("active"))



            btn.classList.add("active")



            result.querySelectorAll(".tab-panel-deck[data-tab-group='deck']")
                .forEach(p => p.classList.remove("active"))



            result.querySelector(
                `.tab-panel-deck[data-tab-group='deck'][data-tab-panel="${btn.dataset.tabKey}"]`
            ).classList.add("active")

        }

    })



    const groupLabels = {

        major: t("Старшие арканы"),

        wands: t("Жезлы"),

        cups: t("Кубки"),

        swords: t("Мечи"),

        pentacles: t("Пентакли"),

    }



    const groupKeys =
        Object.keys(groupLabels)



    function groupCards(cards) {

        const grouped = {

            major: [],

            wands: [],

            cups: [],

            swords: [],

            pentacles: [],

        }



        cards.forEach(card => {

            const key =
                card.arcana === "major"
                    ? "major"
                    : card.suit



            if (grouped[key]) {

                grouped[key].push(card)

            }

        })



        return grouped

    }



    function renderGroupedPanel(panelSelector, subtabPrefix, grouped, onCardClick) {

        const panel =
            result.querySelector(panelSelector)



        panel.innerHTML = `
 
            <div class="deck-subtabs">
 
                ${groupKeys.map(
            (key, i) => `
 
                        <button
 
                            class="tab-btn ${i === 0 ? "active" : ""}"
 
                            data-tab-group="${subtabPrefix}"
 
                            data-tab-key="${key}"
 
                        >
 
                            ${groupLabels[key]}
 
                            <span class="deck-group-count">${grouped[key].length}</span>
 
                        </button>
 
                    `
        ).join("")}
 
            </div>
 
 
 
            <div class="deck-suit-panels">
 
                ${groupKeys.map(
            (key, i) => `
 
                        <div
 
                            class="deck-card-grid tab-panel-suit ${i === 0 ? "active" : ""}"
 
                            data-tab-group="${subtabPrefix}"
 
                            data-tab-panel="${key}"
 
                        >
 
                            ${grouped[key].map(card => cardGridItemHTML(card, false)).join("")}
 
                        </div>
 
                    `
        ).join("")}
 
            </div>
 
        `



        panel.querySelectorAll(`.tab-btn[data-tab-group='${subtabPrefix}']`).forEach(btn => {

            btn.onclick = () => {

                panel.querySelectorAll(`.tab-btn[data-tab-group='${subtabPrefix}']`)
                    .forEach(b => b.classList.remove("active"))



                btn.classList.add("active")



                panel.querySelectorAll(`.tab-panel-suit[data-tab-group='${subtabPrefix}']`)
                    .forEach(p => p.classList.remove("active"))



                panel.querySelector(
                    `.tab-panel-suit[data-tab-group='${subtabPrefix}'][data-tab-panel="${btn.dataset.tabKey}"]`
                ).classList.add("active")

            }

        })



        groupKeys.forEach(key => {

            panel
                .querySelector(`.tab-panel-suit[data-tab-panel="${key}"]`)
                .querySelectorAll(".deck-card-item")
                .forEach((el, i) => {

                    el.onclick = () => onCardClick(grouped[key][i])

                })

        })

    }


    try {

        const remaining =
            await RemainingCardsList()



        document.querySelector("#remaining-total-count").textContent =
            remaining ? remaining.length : 0



        if (!remaining || remaining.length === 0) {

            result.querySelector(
                '.tab-panel-deck[data-tab-panel="remaining"]'
            ).innerHTML = `
 
            <p class="deck-empty-text">${t("Колода пуста")}</p>
 
        `

        }

        else {

            renderGroupedPanel(

                '.tab-panel-deck[data-tab-panel="remaining"]',

                "deck-suit-remaining",

                groupCards(remaining),

                card => openCardModal({

                    card,

                    isReversed: false,

                    quickAnswer: "",

                })
            )

        }

    }

    catch (e) {

        console.error(e)

    }


    try {

        const full =
            await FullDeck()



        document.querySelector("#full-total-count").textContent =
            full.length



        renderGroupedPanel(

            '.tab-panel-deck[data-tab-panel="full"]',

            "deck-suit-full",

            groupCards(full),

            card => openCardModal({

                card,

                isReversed: false,

                quickAnswer: "",

            })
        )

    }

    catch (e) {

        console.error(e)

    }


}


// ==========================================
// Руководство пользователя
// ==========================================

async function showGuideScreen(title, fetchFn) {


    const screenTitle =
        title || t("✦ Руководство пользователя ✦")



    const loader =
        fetchFn || GetGuide



    result.innerHTML = `
 
        <div class="guide-screen">
 
 
            <button class="back-to-history" id="back-from-guide">
 
                ${t("← Назад")}
 
            </button>
 
 
 
            <h2 class="guide-screen-title">
 
                ${screenTitle}
 
            </h2>
 
 
 
            <div id="guide-content" class="guide-content">
 
                <div class="deck-loading">${t("Загрузка...")}</div>
 
            </div>
 
 
        </div>
 
    `



    document
        .querySelector("#back-from-guide")
        .onclick = () => {

            setActive(
                document.querySelector("#settings")
            )

            showSettings()

        }



    try {

        const sections =
            await loader()



        const contentEl =
            document.querySelector("#guide-content")



        if (!sections || sections.length === 0) {

            contentEl.innerHTML = `
 
                <p class="deck-empty-text">${t("Раздел пока недоступен")}</p>
 
            `



            return

        }



        contentEl.innerHTML =
            sections.map(section => `
 
                <div class="guide-section">
 
 
                    <h3 class="guide-section-title">
 
                        ${section.title}
 
                    </h3>
 
 
 
                    <p class="guide-section-text">${section.text}</p>
 
 
                </div>
 
            `).join("")


    }

    catch (e) {

        console.error(e)

    }


}


// ==========================================
// В будущем
// ==========================================
//
// История гаданий
// Избранные карты
// Звуки
// Анимация переворота
// Полноэкранный режим
//