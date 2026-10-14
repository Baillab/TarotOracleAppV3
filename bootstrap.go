package main

import (
	"embed"
	"log"
	"os"
	"path/filepath"
	"runtime"

	"github.com/wailsapp/wails/v3/pkg/application"

	"tarotoracleapp/tarot"
)

// JSON-данные встраиваются в бинарник. Картинки карт не встраиваем:
// их отдаёт фронтенд из frontend/public/cards.
//
//go:embed assets/tarot/*.json
var contentFS embed.FS

func NewTarotService() *TarotService {

	dbPath, err :=
		getDatabasePath()

	if err != nil {

		log.Fatal("Ошибка определения пути к базе:", err)

	}

	storage, err :=
		tarot.NewSQLiteStorage(dbPath)

	if err != nil {

		log.Fatal("Ошибка SQLite:", err)

	}

	service, err :=
		tarot.NewTarotServiceFromFS(
			contentFS,
			"assets/tarot",
			storage,
		)

	if err != nil {

		log.Fatal("Ошибка загрузки колоды:", err)

	}

	log.Println("Tarot Oracle (v3) запущен")

	return &TarotService{
		service: service,
	}

}

// getDatabasePath: на Android берём папку приложения,
// на desktop остаётся ~/.local/share/tarot-oracle.

// getDatabasePath: Android — папка приложения, Windows — %AppData%,
// Linux — ~/.local/share (как раньше, чтобы не потерять историю).
func getDatabasePath() (string, error) {

	if dir := application.Mobile.StoragePath(); dir != "" {

		return filepath.Join(dir, "tarot.db"), nil

	}

	var base string

	if runtime.GOOS == "windows" {

		cfg, err :=
			os.UserConfigDir()

		if err != nil {

			return "", err

		}

		base = cfg

	} else {

		home, err :=
			os.UserHomeDir()

		if err != nil {

			return "", err

		}

		base =
			filepath.Join(home, ".local", "share")

	}

	dir :=
		filepath.Join(base, "tarot-oracle")

	if err := os.MkdirAll(dir, 0755); err != nil {

		return "", err

	}

	return filepath.Join(dir, "tarot.db"), nil

}
