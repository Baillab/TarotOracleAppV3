package tarot

import (
	"encoding/json"
	"fmt"
	"io/fs"
)

// LoadDeckFromFS загружает колоду из embed.FS вместо
// обычной файловой системы — нужно для платформ (Android/iOS),
// где обычного пути к файлам на диске не существует.
func LoadDeckFromFS(
	fsys fs.FS,
	basePath string,
) (*Deck, error) {

	var allCards []Card

	for _, file := range deckFiles {

		fullPath :=
			basePath + "/" + file

		data, err :=
			fs.ReadFile(
				fsys,
				fullPath,
			)

		if err != nil {

			return nil, fmt.Errorf(
				"не удалось открыть %s: %w",
				fullPath,
				err,
			)

		}

		var cards []Card

		if err := json.Unmarshal(data, &cards); err != nil {

			return nil, fmt.Errorf(
				"ошибка чтения JSON %s: %w",
				fullPath,
				err,
			)

		}

		allCards = append(allCards, cards...)

	}

	if len(allCards) != 78 {

		return nil, fmt.Errorf(
			"неверное количество карт: ожидалось 78, получено %d",
			len(allCards),
		)

	}

	return NewDeck(allCards), nil

}

// LoadQuestionsFromFS — то же самое для вопросов.
func LoadQuestionsFromFS(
	fsys fs.FS,
	path string,
) ([]QuestionCategory, error) {

	data, err :=
		fs.ReadFile(
			fsys,
			path,
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

// LoadGuideFromFS — то же самое для guide.json / about-tarot.json.
func LoadGuideFromFS(
	fsys fs.FS,
	path string,
) ([]GuideSection, error) {

	data, err :=
		fs.ReadFile(
			fsys,
			path,
		)

	if err != nil {

		return nil, err

	}

	var result []GuideSection

	if err := json.Unmarshal(data, &result); err != nil {

		return nil, err

	}

	return result, nil

}

// LoadLegalFromFS — то же самое для legal.json.
func LoadLegalFromFS(
	fsys fs.FS,
	path string,
) (*LegalDocs, error) {

	data, err :=
		fs.ReadFile(
			fsys,
			path,
		)

	if err != nil {

		return nil, err

	}

	var result LegalDocs

	if err := json.Unmarshal(data, &result); err != nil {

		return nil, err

	}

	return &result, nil

}
