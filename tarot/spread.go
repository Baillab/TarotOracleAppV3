package tarot

// ============================================================
// Описание раскладов
// ============================================================

type Spread struct {
	ID string `json:"id"`

	Name string `json:"name"`

	Description string `json:"description"`

	// Размер области расклада для интерфейса
	Width int `json:"width"`

	Height int `json:"height"`

	Positions []SpreadPosition `json:"positions"`
}

// Позиция карты в раскладе.
type SpreadPosition struct {
	Index int `json:"index"`

	// внутренний ключ позиции
	Key string `json:"key"`

	Name string `json:"name"`

	Description string `json:"description"`

	// координаты для frontend (%)
	X float64 `json:"x"`

	Y float64 `json:"y"`

	// угол поворота карты
	Rotation float64 `json:"rotation"`
}

// Карта в конкретной позиции.
type SpreadCard struct {
	Position SpreadPosition `json:"position"`

	Card Card `json:"card"`

	IsReversed bool `json:"isReversed"`

	QuickAnswer string `json:"quickAnswer,omitempty"`
}

// Результат гадания.
type SpreadResult struct {
	Spread Spread `json:"spread"`

	Cards []SpreadCard `json:"cards"`

	QuickAnswer string `json:"quickAnswer,omitempty"`

	HistoryID int `json:"historyId,omitempty"`
}

// ============================================================
// Реестр раскладов
// ============================================================

var Spreads = map[string]Spread{

	// --------------------------------------------------------
	// Одна карта
	// --------------------------------------------------------

	"one": {

		ID: "one",

		Name: "Одна карта",

		Description: "Быстрый ответ на вопрос.",

		Width: 100,

		Height: 100,

		Positions: []SpreadPosition{

			{
				Index: 1,

				Key: "answer",

				Name: "",

				Description: "Главный ответ.",

				X: 50,

				Y: 50,
			},
		},
	},

	// --------------------------------------------------------
	// Три карты
	// --------------------------------------------------------

	"three": {

		ID: "three",

		Name: "Три карты",

		Description: "Прошлое, настоящее и будущее.",

		Width: 100,

		Height: 100,

		Positions: []SpreadPosition{

			{
				Index: 1,

				Key: "past",

				Name: "Прошлое",

				Description: "Что привело к ситуации.",

				X: 10,

				Y: 50,
			},

			{
				Index: 2,

				Key: "present",

				Name: "Настоящее",

				Description: "Что происходит сейчас.",

				X: 50,

				Y: 50,
			},

			{
				Index: 3,

				Key: "future",

				Name: "Будущее",

				Description: "Вероятное развитие.",

				X: 90,

				Y: 50,
			},
		},
	},

	// --------------------------------------------------------
	// Отношения
	// --------------------------------------------------------

	"relationship": {

		ID: "relationship",

		Name: "Отношения",

		Description: "Анализ отношений.",

		Width: 100,

		Height: 120,

		Positions: []SpreadPosition{

			{
				Index:       1,
				Key:         "relationship",
				Name:        "Суть отношений",
				Description: "Основа союза",
				X:           50,
				Y:           10,
			},

			{
				Index:       2,
				Key:         "you",
				Name:        "Вы",
				Description: "Ваше состояние",
				X:           15,
				Y:           25,
			},

			{
				Index:       3,
				Key:         "partner",
				Name:        "Партнёр",
				Description: "Его состояние",
				X:           85,
				Y:           25,
			},

			{
				Index:       4,
				Key:         "feelings_you",
				Name:        "Ваши чувства",
				Description: "Что вы испытываете",
				X:           15,
				Y:           85,
			},

			{
				Index:       5,
				Key:         "feelings_partner",
				Name:        "Его чувства",
				Description: "Что чувствует партнёр",
				X:           85,
				Y:           85,
			},

			{
				Index:       6,
				Key:         "future",
				Name:        "Будущее",
				Description: "Перспектива",
				X:           50,
				Y:           105,
			},
		},
	},

	// --------------------------------------------------------
	// Подкова
	// --------------------------------------------------------

	"horseshoe": {

		ID: "horseshoe",

		Name: "Подкова",

		Description: "Классический расклад ситуации.",

		Width: 120,

		Height: 120,

		Positions: []SpreadPosition{

			{
				Index: 1,
				Key:   "past",
				Name:  "Прошлое",
				X:     18,
				Y:     90,
			},

			{
				Index: 2,
				Key:   "present",
				Name:  "Настоящее",
				X:     33,
				Y:     40,
			},

			{
				Index: 3,
				Key:   "hidden",
				Name:  "Скрытое",
				X:     58,
				Y:     10,
			},

			{
				Index: 4,
				Key:   "obstacle",
				Name:  "Препятствие",
				X:     83,
				Y:     40,
			},

			{
				Index: 5,
				Key:   "environment",
				Name:  "Окружение",
				X:     98,
				Y:     90,
			},

			{
				Index: 6,
				Key:   "advice",
				Name:  "Совет",
				X:     73,
				Y:     110,
			},

			{
				Index: 7,
				Key:   "result",
				Name:  "Итог",
				X:     43,
				Y:     110,
			},
		},
	},

	// --------------------------------------------------------
	// Кельтский крест
	// --------------------------------------------------------

	"celtic_cross": {

		ID: "celtic_cross",

		Name: "Кельтский крест",

		Description: "Полный анализ ситуации.",

		Width: 150,

		Height: 190,

		Positions: []SpreadPosition{

			{
				Index: 1,
				Key:   "present",
				Name:  "Настоящее",
				X:     45,
				Y:     70,
			},

			{
				Index:    2,
				Key:      "cross",
				Name:     "Препятствие",
				X:        45,
				Y:        70,
				Rotation: 90,
			},

			{
				Index: 3,
				Key:   "past",
				Name:  "Прошлое",
				X:     0,
				Y:     70,
			},

			{
				Index: 4,
				Key:   "future",
				Name:  "Будущее",
				X:     90,
				Y:     70,
			},

			{
				Index: 5,
				Key:   "conscious",
				Name:  "Сознание",
				X:     45,
				Y:     0,
			},

			{
				Index: 6,
				Key:   "subconscious",
				Name:  "Подсознание",
				X:     45,
				Y:     140,
			},

			{
				Index: 7,
				Key:   "you",
				Name:  "Вы",
				X:     130,
				Y:     190,
			},

			{
				Index: 8,
				Key:   "others",
				Name:  "Окружение",
				X:     130,
				Y:     127,
			},

			{
				Index: 9,
				Key:   "hopes",
				Name:  "Надежды и страхи",
				X:     130,
				Y:     63,
			},

			{
				Index: 10,
				Key:   "result",
				Name:  "Итог",
				X:     130,
				Y:     0,
			},
		},
	},
}

// SpreadOrder задаёт фиксированный порядок
// отображения раскладов на фронтенде.
var SpreadOrder = []string{
	"one",
	"three",
	"relationship",
	"horseshoe",
	"celtic_cross",
}
