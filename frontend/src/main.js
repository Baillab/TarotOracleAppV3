import './app.css'

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




// ==========================================
// Интерфейс
// ==========================================

document.querySelector("#app").innerHTML = `

<div class="layout">


    <aside class="sidebar">


        <h1 class="logo">

            ✦ Tarot Oracle ✦

        </h1>



        <div class="menu">


            <button id="draw" class="action-button">

                ✦ Вытянуть карту

            </button>



            <button id="daily" class="action-button">

                ✦ Карта дня

            </button>


        </div>



        <div class="spread-title">

            РАСКЛАДЫ

        </div>



        <div id="spread-list" class="spread-list">

        </div>



        <div class="icon-row">


    <button id="shuffle" class="icon-button" title="Перемешать">

        🂠

    </button>



    <button id="history" class="icon-button" title="История">

        🕒

    </button>



    <button id="deck-info" class="icon-button" title="Колода">

        🗂

    </button>



    <button id="settings" class="icon-button" title="Настройки">

        ⚙

    </button>



    <button id="interpretation-icon" class="icon-button" title="Толкование расклада">

        📖

    </button>


</div>


    </aside>


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



let activeButton =
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

                ✦ Толкование ✦

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

            Ваш комментарий

        </h2>



        <textarea

            id="comment-textarea"

            class="comment-textarea"

            placeholder="Добавьте заметку об этом раскладе..."

            rows="5"

        >${existingComment || ""}</textarea>



        <div class="question-actions">


            <button id="comment-save" class="confirm-btn confirm-yes-gold">

                Сохранить

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

        { key: "love", label: "Любовь", value: m.love },

        { key: "career", label: "Карьера", value: m.career },

        { key: "finance", label: "Финансы", value: m.finance },

        { key: "health", label: "Здоровье", value: m.health },

        { key: "advice", label: "Совет", value: m.advice },

    ]



    const buttons =
        tabs.map(
            (t, i) => `

                <button

                    class="tab-btn ${i === 0 ? "active" : ""}"

                    data-tab-group="${prefix}"

                    data-tab-key="${t.key}"

                >

                    ${t.label}

                </button>

            `
        ).join("")



    const panels =
        tabs.map(
            (t, i) => `

                <div

                    class="tab-panel ${i === 0 ? "active" : ""}"

                    data-tab-group="${prefix}"

                    data-tab-panel="${t.key}"

                >

                    ${t.value}

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



    document
        .querySelector(`.tab-panel[data-tab-group="${group}"][data-tab-panel="${key}"]`)
        .classList.add("active")

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

            ${card.name}${item.isReversed ? " (перевёрнутая)" : ""}

        </h2>



        ${keywordsHTML(card)}



        ${item.quickAnswer ? `

            <div class="quick-answer ${answerClass(item.quickAnswer)}">

                ${item.quickAnswer}

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


function showConfirm(text, onConfirm) {

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

                Да, очистить

            </button>



            <button id="confirm-no" class="confirm-btn confirm-no">

                Отмена

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

            Задайте вопрос или начните без него

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

            placeholder="Свой вопрос..."

            rows="3"

        ></textarea>



        <div class="question-actions">


            <button id="question-skip" class="confirm-btn confirm-no">

                Без вопроса

            </button>



            <button id="question-start" class="confirm-btn confirm-yes-gold">

                Начать расклад

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

                    openQuestionModal(spread)

                }


            spreadList.appendChild(button)



        })


    }


    catch (e) {


        console.error(e)


    }


}

loadSpreads()



showWelcomeDeck()



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



            showCard(answer)



        }


        catch (e) {


            console.error(e)



            showMessage(
                "Ошибка получения карты"
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



            showDailyCard(daily)



        }


        catch (e) {


            console.error(e)



            showMessage(
                "Ошибка карты дня"
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

                Выберите карту или расклад, чтобы увидеть толкование.

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

                Выберите действие слева, чтобы начать

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

                Выберите карту или расклад, чтобы увидеть толкование.

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

    
            ${card.name}${answer.isReversed ? " (перевёрнутая)" : ""}


            </h2>



            ${keywordsHTML(card)}



            ${answer.quickAnswer ? `

                <div class="quick-answer ${answerClass(answer.quickAnswer)}">

                    ${answer.quickAnswer}

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

        title="Добавить комментарий"

    >

        📝

    </button>

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

                Толкование

            </div>



            <div class="interpretation-card">

                ${card.name}${answer.isReversed ? " (перевёрнутая)" : ""}

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

                ${card.name}${drawn.isReversed ? " (перевёрнутая)" : ""}

            </h3>



            ${keywordsHTML(card)}



            ${drawn.quickAnswer ? `

                <div class="quick-answer ${answerClass(drawn.quickAnswer)}">

                    ${drawn.quickAnswer}

                </div>

            ` : ""}



            <p>

                ${meaning.text}

            </p>



            ${cardMeaningTabs(card, drawn.isReversed, "daily")}


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

                Толкование

            </div>



            <div class="interpretation-card">

                ${card.name}${drawn.isReversed ? " (перевёрнутая)" : ""}

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
            "Ошибка расклада"
        )


    }


    finally {


        result.classList.remove("loading")


    }


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

            <span class="spread-answer-label">Общий ответ:</span>

            <span class="spread-answer-value">${data.quickAnswer}</span>

        </div>

    ` : ""}



    ${data.historyId ? `

        <button

            class="comment-icon-btn"

            data-history-id="${data.historyId}"

            title="Добавить комментарий"

        >

            📝

        </button>

    ` : ""}



    <div class="spread-area"></div>

`




    const area =
        document.querySelector(".spread-area")



    const spreadWidth =
        data.spread.width || 100



    const spreadHeight =
        data.spread.height || 100



    const margin = 12



    function normalize(x, y) {

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



    area.style.setProperty(
        "--card-scale",
        scale
    )



    data.cards.forEach(
        (item, index) => {


            const p =
                item.position



            const pos =
                normalize(p.x, p.y)



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

                    ${item.card.name}${item.isReversed ? " (п.)" : ""}

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

                rotate(${p.rotation || 0}deg)

            `





            area.appendChild(card)







            setTimeout(() => {


                card.style.transform = `

                    translate(-50%, -50%)

                    scale(1)

                    rotate(${p.rotation || 0}deg)

                `




                card.style.opacity =
                    "1"



            },

                200 + index * 170)




        }

    )



    const interpretationHTML =
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

                        ${item.card.name}${item.isReversed ? " (перевёрнутая)" : ""}

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

                    Выберите карту или расклад, чтобы увидеть толкование.

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

                ✦ История гаданий ✦

            </h2>



            <p class="welcome-text">

                История пока пуста

            </p>


        </div>

    `



            return

        }


        result.innerHTML = `

    <div class="history-list">


        <h2 class="history-title">

            ✦ История гаданий ✦

        </h2>



        <div class="history-header">


            <span class="history-count">Записей: ${sorted.length}</span>



            <button id="clear-history" class="history-clear-btn">

                Очистить всё

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



                        <button class="history-delete" data-id="${r.id}" title="Удалить">

                            ✕

                        </button>

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
                    "Удалить всю историю гаданий без возможности восстановления?",

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



        showMessage("Ошибка загрузки истории")


    }


}



// ==========================================
// История — открыть конкретную запись
// ==========================================


function backToHistoryButton() {

    return `

        <button class="back-to-history" id="back-to-history">

            ← К истории

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

            showMessage("Данные расклада недоступны")

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
// Настройки
// ==========================================


const APP_INFO = {

    name: "Tarot Oracle",

    version: "1.0.0",

    description: "Приложение для гаданий на картах Таро: расклады, карта дня и толкования.",

}

function showSettings() {


    result.innerHTML = `


        <div class="settings-screen">


            <h2 class="settings-title">

                ✦ Настройки ✦

            </h2>



            <div class="settings-group">


                <div class="settings-group-title">Колода</div>



                <div class="settings-options">


                    <button

                        class="settings-option ${appSettings.deckMode === "full" ? "active" : ""}"

                        data-setting="deckMode"

                        data-value="full"

                    >

                        Полная (78 карт)

                    </button>



                    <button

                        class="settings-option ${appSettings.deckMode === "major" ? "active" : ""}"

                        data-setting="deckMode"

                        data-value="major"

                    >

                        Старшие арканы (22)

                    </button>


                </div>



                <p class="settings-hint">

                    При смене режима колода будет пересобрана и перемешана.

                </p>


            </div>

            <div class="settings-group">


    <div class="settings-group-title">Способ вытягивания</div>



    <div class="settings-options">


        <button

            class="settings-option ${appSettings.drawMode !== "random" ? "active" : ""}"

            data-setting="drawMode"

            data-value="sequential"

        >

            По порядку

        </button>



        <button

            class="settings-option ${appSettings.drawMode === "random" ? "active" : ""}"

            data-setting="drawMode"

            data-value="random"

        >

            Случайно

        </button>


    </div>



    <p class="settings-hint">

        «По порядку» — карты вытягиваются последовательно из уже перемешанной колоды. «Случайно» — каждая карта выбирается заново из оставшихся.

    </p>


</div>



            <div class="settings-group">


                <div class="settings-group-title">

                    Стиль колоды <span class="settings-soon">Скоро</span>

                </div>



                <div class="settings-options">


                    <button class="settings-option active" disabled>

                        Классическая

                    </button>



                    <button class="settings-option" disabled>

                        Тёмная

                    </button>



                    <button class="settings-option" disabled>

                        Акварель

                    </button>


                </div>


            </div>



            <div class="settings-group">


                <div class="settings-group-title">

                    Язык <span class="settings-soon">Скоро</span>

                </div>



                <div class="settings-options">


                    <button class="settings-option active" disabled>

                        Русский

                    </button>



                    <button class="settings-option" disabled>

                        English

                    </button>


                </div>


            </div>



            <div class="settings-group">


                <div class="settings-group-title">О программе</div>



                <button class="settings-link" id="open-about">

                    ${APP_INFO.name} · версия ${APP_INFO.version}

                </button>


                 <button class="settings-link" id="open-guide">

        Руководство пользователя

    </button>

    <button class="settings-link" id="open-about-tarot">

        О картах Таро

    </button>


            </div>



            <div class="settings-group">


                <button class="settings-link" id="open-privacy">

                    Политика конфиденциальности

                </button>



                <button class="settings-link" id="open-terms">

                    Условия использования

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

                `Версия ${APP_INFO.version}<br><br>${APP_INFO.description}`

            )

        }

    document
        .querySelector("#open-guide")
        .onclick = () => {

            showGuideScreen(
                "✦ Руководство пользователя ✦",
                GetGuide
            )

        }

    document
        .querySelector("#open-about-tarot")
        .onclick = () => {

            showGuideScreen(
                "✦ О картах Таро ✦",
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

                    showInfoModal("Политика конфиденциальности", "Текст пока недоступен.")



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

                    showInfoModal("Условия использования", "Текст пока недоступен.")



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

        if (activeButton === document.querySelector("#deck-info")) {

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

                ✦ Колода ✦

            </h2>


            <div class="deck-tabs">


    <button class="tab-btn active" data-tab-group="deck" data-tab-key="remaining">

        Оставшиеся карты

        <span class="deck-group-count" id="remaining-total-count"></span>

    </button>



    <button class="tab-btn" data-tab-group="deck" data-tab-key="full">

        Вся колода

        <span class="deck-group-count" id="full-total-count"></span>

    </button>


</div>



            <div

                class="tab-panel-deck active"

                data-tab-group="deck"

                data-tab-panel="remaining"

            >

                <div class="deck-loading">Загрузка...</div>

            </div>



            <div

                class="tab-panel-deck"

                data-tab-group="deck"

                data-tab-panel="full"

            >

                <div class="deck-loading">Загрузка...</div>

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

        major: "Старшие арканы",

        wands: "Жезлы",

        cups: "Кубки",

        swords: "Мечи",

        pentacles: "Пентакли",

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

            <p class="deck-empty-text">Колода пуста</p>

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
        title || "✦ Руководство пользователя ✦"



    const loader =
        fetchFn || GetGuide



    result.innerHTML = `

        <div class="guide-screen">


            <button class="back-to-history" id="back-from-guide">

                ← Назад

            </button>



            <h2 class="guide-screen-title">

                ${screenTitle}

            </h2>



            <div id="guide-content" class="guide-content">

                <div class="deck-loading">Загрузка...</div>

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

                <p class="deck-empty-text">Раздел пока недоступен</p>

            `



            return

        }



        contentEl.innerHTML =
            sections.map(section => `

                <div class="guide-section">


                    <h3 class="guide-section-title">

                        ${section.title}

                    </h3>



                    <p class="guide-section-text">

                        ${section.text}

                    </p>


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