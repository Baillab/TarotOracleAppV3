package tarot

import "fmt"

// QuickAnswer короткий ответ да/нет
// для прямого и перевёрнутого положения карты.
type QuickAnswer struct {
	Upright  string
	Reversed string
}

// quickAnswers таблица быстрых ответов по ID карты.
var quickAnswers = map[string]QuickAnswer{

	// ---------------- Старшие арканы ----------------

	"major_00": {"Да", "Нет"},
	"major_01": {"Да", "Нет"},
	"major_02": {"Неопределённо", "Нет"},
	"major_03": {"Да", "Скорее нет"},
	"major_04": {"Да", "Нет"},
	"major_05": {"Да", "Скорее нет"},
	"major_06": {"Да", "Нет"},
	"major_07": {"Да", "Нет"},
	"major_08": {"Да", "Скорее нет"},
	"major_09": {"Скорее нет", "Нет"},
	"major_10": {"Да", "Нет"},
	"major_11": {"Да", "Нет"},
	"major_12": {"Скорее нет", "Нет"},
	"major_13": {"Нет", "Скорее нет"},
	"major_14": {"Да", "Нет"},
	"major_15": {"Нет", "Скорее да"},
	"major_16": {"Нет", "Скорее нет"},
	"major_17": {"Да", "Скорее нет"},
	"major_18": {"Скорее нет", "Скорее да"},
	"major_19": {"Да", "Скорее да"},
	"major_20": {"Да", "Скорее нет"},
	"major_21": {"Да", "Скорее нет"},
}

// suitNumberAnswer базовый ответ по номеру карты
// младшего аркана (1-14), общий для большинства мастей.
var suitNumberAnswer = map[int]QuickAnswer{

	1:  {"Да", "Скорее нет"},
	2:  {"Скорее да", "Скорее нет"},
	3:  {"Да", "Скорее нет"},
	4:  {"Скорее да", "Нет"},
	5:  {"Нет", "Скорее да"},
	6:  {"Да", "Скорее нет"},
	7:  {"Скорее нет", "Скорее да"},
	8:  {"Скорее да", "Нет"},
	9:  {"Скорее да", "Нет"},
	10: {"Да", "Нет"},
	11: {"Скорее да", "Нет"},
	12: {"Скорее да", "Нет"},
	13: {"Да", "Скорее нет"},
	14: {"Да", "Скорее нет"},
}

// swordsOverrides — мечи традиционно тяжелее по смыслу,
// переопределяем часть номеров.
var swordsOverrides = map[int]QuickAnswer{

	3:  {"Нет", "Скорее да"},
	6:  {"Скорее да", "Нет"},
	9:  {"Нет", "Скорее да"},
	10: {"Нет", "Скорее да"},
}

func init() {

	suits := []string{
		"pentacles",
		"cups",
		"swords",
		"wands",
	}

	for _, suit := range suits {

		for number := 1; number <= 14; number++ {

			answer :=
				suitNumberAnswer[number]

			if suit == "swords" {

				if override, ok :=
					swordsOverrides[number]; ok {

					answer = override

				}

			}

			id :=
				fmt.Sprintf(
					"%s_%02d",
					suit,
					number,
				)

			quickAnswers[id] = answer

		}

	}

}

// GetQuickAnswer возвращает быстрый ответ
// для карты в заданном положении.
func GetQuickAnswer(
	cardID string,
	isReversed bool,
) string {

	qa, ok :=
		quickAnswers[cardID]

	if !ok {

		return ""

	}

	if isReversed {

		return qa.Reversed

	}

	return qa.Upright

}

// quickAnswerScore числовой вес ответа
// для агрегации по нескольким картам.
var quickAnswerScore = map[string]float64{

	"Да":            2,
	"Скорее да":     1,
	"Неопределённо": 0,
	"Скорее нет":    -1,
	"Нет":           -2,
}

// AggregateQuickAnswer считает общий ответ
// по нескольким быстрым ответам карт расклада.
func AggregateQuickAnswer(
	answers []string,
) string {

	if len(answers) == 0 {

		return ""

	}

	var total float64

	var count float64

	for _, a := range answers {

		score, ok :=
			quickAnswerScore[a]

		if !ok {

			continue

		}

		total += score

		count++

	}

	if count == 0 {

		return ""

	}

	avg :=
		total / count

	switch {

	case avg >= 1.5:
		return "Да"

	case avg >= 0.5:
		return "Скорее да"

	case avg > -0.5:
		return "Неопределённо"

	case avg > -1.5:
		return "Скорее нет"

	default:
		return "Нет"

	}

}
