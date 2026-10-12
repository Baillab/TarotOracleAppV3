package tarot

import "io/fs"

// NewTarotServiceFromFS создаёт сервис, читая колоду, вопросы,
// руководство и юридические тексты из embed.FS, а не с диска.
func NewTarotServiceFromFS(
	fsys fs.FS,
	basePath string,
	storage *SQLiteStorage,
) (*TarotService, error) {

	deck, err :=
		LoadDeckFromFS(
			fsys,
			basePath,
		)

	if err != nil {

		return nil, err

	}

	// Старый конструктор пытается читать JSON с диска,
	// ошибки там игнорируются. Ниже подменяем данные
	// версиями из embed.FS.
	service :=
		NewTarotService(
			deck,
			basePath,
			storage,
		)

	if q, err := LoadQuestionsFromFS(fsys, basePath+"/questions.json"); err == nil {

		service.questions = q

	}

	if g, err := LoadGuideFromFS(fsys, basePath+"/guide.json"); err == nil {

		service.guide = g

	}

	if a, err := LoadGuideFromFS(fsys, basePath+"/about-tarot.json"); err == nil {

		service.aboutTarot = a

	}

	if l, err := LoadLegalFromFS(fsys, basePath+"/legal.json"); err == nil {

		service.legal = l

	}

	return service, nil

}
