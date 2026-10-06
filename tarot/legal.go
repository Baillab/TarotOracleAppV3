package tarot

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// LegalSection один текстовый документ (политика или условия).
type LegalSection struct {
	Title      string   `json:"title"`
	Paragraphs []string `json:"paragraphs"`
}

// LegalDocs оба юридических документа приложения.
type LegalDocs struct {
	Privacy LegalSection `json:"privacy"`
	Terms   LegalSection `json:"terms"`
}

// LoadLegal загружает политику конфиденциальности
// и условия использования из JSON.
func LoadLegal(path string) (*LegalDocs, error) {

	data, err :=
		os.ReadFile(
			filepath.Clean(path),
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
