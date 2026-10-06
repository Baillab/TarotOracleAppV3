package main

import (
	"log"
	"os"
	"path/filepath"

	"tarotoracleapp/tarot"
)

// TarotService — сервис, который Wails v3 забиндит на фронтенд.
// Методы те же, что были у App в v2, но теперь это
// application.Service, а не часть структуры с ctx.
type TarotService struct {
	service *tarot.TarotService
}

// NewTarotService создаёт и инициализирует сервис:
// грузит колоду, открывает SQLite, настраивает всё
// так же, как раньше делал App.startup() в v2.
func NewTarotService() *TarotService {

	deck, err :=
		tarot.LoadDeckFolder(
			"assets/tarot",
		)

	if err != nil {

		log.Fatal(
			"Ошибка загрузки колоды:",
			err,
		)

	}

	dbPath, err :=
		getDatabasePath()

	if err != nil {

		log.Fatal(
			"Ошибка определения пути к базе:",
			err,
		)

	}

	storage, err :=
		tarot.NewSQLiteStorage(
			dbPath,
		)

	if err != nil {

		log.Fatal(
			"Ошибка SQLite:",
			err,
		)

	}

	service :=
		tarot.NewTarotService(
			deck,
			"assets/tarot",
			storage,
		)

	log.Println(
		"Tarot Oracle (v3) запущен",
	)

	return &TarotService{
		service: service,
	}

}

// =====================================
// Колода
// =====================================

func (a *TarotService) Shuffle() string {

	return a.service.Shuffle()

}

func (a *TarotService) ResetDeck() string {

	return a.service.ResetDeck()

}

func (a *TarotService) RemainingCards() int {

	return a.service.RemainingCards()

}

func (a *TarotService) RemainingCardsList() []tarot.Card {

	return a.service.RemainingCardsList()

}

func (a *TarotService) FullDeck() []tarot.Card {

	return a.service.FullDeck()

}

// =====================================
// Карты
// =====================================

func (a *TarotService) DrawCard() (*tarot.DrawnCard, error) {

	return a.service.DrawCard()

}

func (a *TarotService) DrawCards(
	count int,
) ([]tarot.DrawnCard, error) {

	return a.service.DrawCards(
		count,
	)

}

// =====================================
// Карта дня
// =====================================

func (a *TarotService) GetDailyCard() (*tarot.DailyCard, error) {

	return a.service.GetDailyCard()

}

func (a *TarotService) ResetDailyCard() {

	a.service.ResetDailyCard()

}

func (a *TarotService) GetDailyAnimation() *tarot.DailyAnimation {

	return a.service.GetDailyAnimation()

}

// =====================================
// Расклады
// =====================================

func (a *TarotService) GetSpreads() []tarot.Spread {

	return a.service.GetSpreads()

}

func (a *TarotService) DrawSpread(
	spreadID string,
	question string,
) (*tarot.SpreadResult, error) {

	return a.service.DrawSpread(
		spreadID,
		question,
	)

}

func (a *TarotService) LastSpread() *tarot.Spread {

	return a.service.LastSpread()

}

// =====================================
// История
// =====================================

func (a *TarotService) GetHistory() []tarot.HistoryRecord {

	return a.service.GetHistory()

}

func (a *TarotService) GetLastHistory(
	count int,
) []tarot.HistoryRecord {

	return a.service.GetLastHistory(
		count,
	)

}

func (a *TarotService) ClearHistory() {

	a.service.ClearHistory()

}

func (a *TarotService) HistoryCount() int {

	return a.service.HistoryCount()

}

func (a *TarotService) DeleteHistoryRecord(
	id int,
) {

	a.service.DeleteHistoryRecord(id)

}

func (a *TarotService) UpdateHistoryComment(
	id int,
	comment string,
) {

	a.service.UpdateHistoryComment(id, comment)

}

// =====================================
// Вопросы / Руководство / Юридическое
// =====================================

func (a *TarotService) GetQuestions() []tarot.QuestionCategory {

	return a.service.GetQuestions()

}

func (a *TarotService) GetGuide() []tarot.GuideSection {

	return a.service.GetGuide()

}

func (a *TarotService) GetAboutTarot() []tarot.GuideSection {

	return a.service.GetAboutTarot()

}

func (a *TarotService) GetLegal() *tarot.LegalDocs {

	return a.service.GetLegal()

}

// =====================================
// Настройки
// =====================================

func (a *TarotService) GetSettings() map[string]string {

	return a.service.GetSettings()

}

func (a *TarotService) UpdateSetting(
	key string,
	value string,
) {

	a.service.UpdateSetting(key, value)

}

// =====================================
// Информация
// =====================================

func (a *TarotService) Today() string {

	return a.service.Today()

}

func (a *TarotService) Status() map[string]interface{} {

	return a.service.Status()

}

// getDatabasePath возвращает единый путь к базе данных
// в домашней папке пользователя.
func getDatabasePath() (string, error) {

	home, err :=
		os.UserHomeDir()

	if err != nil {

		return "", err

	}

	dir :=
		filepath.Join(
			home,
			".local",
			"share",
			"tarot-oracle",
		)

	err =
		os.MkdirAll(
			dir,
			0755,
		)

	if err != nil {

		return "", err

	}

	return filepath.Join(
		dir,
		"tarot.db",
	), nil

}
