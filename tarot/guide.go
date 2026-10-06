package tarot

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// GuideSection один раздел руководства (или справки о Таро).
type GuideSection struct {
	Title string `json:"title"`
	Text  string `json:"text"`
}

// loadSections общая загрузка массива разделов из JSON.
func loadSections(path string) ([]GuideSection, error) {

	data, err :=
		os.ReadFile(
			filepath.Clean(path),
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

// LoadGuide загружает разделы руководства пользователя.
func LoadGuide(path string) ([]GuideSection, error) {

	return loadSections(path)

}

// LoadAboutTarot загружает разделы справки о картах Таро.
func LoadAboutTarot(path string) ([]GuideSection, error) {

	return loadSections(path)

}
