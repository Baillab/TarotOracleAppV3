package tarot

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// QuestionCategory группа вопросов с подписью.
type QuestionCategory struct {
	ID string `json:"id"`

	Label string `json:"label"`

	Questions []string `json:"questions"`
}

// QuestionOrder задаёт фиксированный порядок
// отображения категорий вопросов на фронтенде.
var QuestionOrder = []string{
	"general",
	"love",
	"career",
	"finance",
	"health",
}

// LoadQuestions загружает вопросы по категориям из JSON
// и возвращает их в фиксированном порядке (QuestionOrder).
func LoadQuestions(path string) ([]QuestionCategory, error) {

	data, err :=
		os.ReadFile(
			filepath.Clean(path),
		)

	if err != nil {

		return nil, err

	}

	var raw map[string]QuestionCategory

	if err := json.Unmarshal(data, &raw); err != nil {

		return nil, err

	}

	result :=
		make(
			[]QuestionCategory,
			0,
			len(QuestionOrder),
		)

	for _, id := range QuestionOrder {

		if category, ok := raw[id]; ok {

			category.ID = id

			result =
				append(
					result,
					category,
				)

		}

	}

	return result, nil

}
