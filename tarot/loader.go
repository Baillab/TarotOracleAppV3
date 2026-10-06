package tarot

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// Список файлов, составляющих полную колоду.
var deckFiles = []string{
	"major.json",
	"wands.json",
	"cups.json",
	"swords.json",
	"pentacles.json",
}

// LoadDeckFolder загружает все карты из указанной папки.
//
// Пример:
//
//	deck, err := tarot.LoadDeckFolder("assets/tarot")
func LoadDeckFolder(path string) (*Deck, error) {

	var allCards []Card

	for _, file := range deckFiles {

		fullPath := filepath.Join(path, file)

		//fmt.Println("Загружаю файл:", fullPath)

		data, err := os.ReadFile(fullPath)
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

		//fmt.Println(file, "загружено:", len(cards))

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
