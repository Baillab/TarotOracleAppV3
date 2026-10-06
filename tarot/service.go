package tarot

import (
	"fmt"
	"path/filepath"
	"time"
)

// TarotService главный API слой Wails.

type TarotService struct {
	deck *Deck

	allCards []Card

	history *History

	daily *DailyManager

	storage *SQLiteStorage

	lastSpread *Spread

	deckPath string

	questions []QuestionCategory

	settings map[string]string

	guide []GuideSection

	aboutTarot []GuideSection

	legal *LegalDocs
}

// NewTarotService создание сервиса.
func NewTarotService(
	deck *Deck,
	deckPath string,
	storage *SQLiteStorage,
) *TarotService {

	questions, _ :=
		LoadQuestions(
			filepath.Join(
				deckPath,
				"questions.json",
			),
		)

	guide, _ :=
		LoadGuide(
			filepath.Join(
				deckPath,
				"guide.json",
			),
		)

	aboutTarot, _ :=
		LoadAboutTarot(
			filepath.Join(
				deckPath,
				"about-tarot.json",
			),
		)

	legal, _ :=
		LoadLegal(
			filepath.Join(
				deckPath,
				"legal.json",
			),
		)

	service := &TarotService{

		deck: deck,

		allCards: deck.OriginalCards(),

		deckPath: deckPath,

		history: NewHistory(),

		daily: NewDailyManager(),

		storage: storage,

		questions: questions,

		settings: defaultSettings(),

		guide: guide,

		aboutTarot: aboutTarot,

		legal: legal,
	}

	if storage != nil {

		records, err :=
			storage.LoadHistory()

		if err == nil {

			for _, item := range records {

				service.history.Restore(item)

			}

		}

		daily, err :=
			storage.LoadDaily()

		if err == nil &&
			daily != nil {

			service.daily.card = daily

		}

		saved, err :=
			storage.LoadSettings()

		if err == nil {

			for key, value := range saved {

				service.settings[key] = value

			}

		}

	}

	service.applyDeckMode(
		service.settings["deckMode"],
	)

	return service
}

// defaultSettings значения по умолчанию.
func defaultSettings() map[string]string {

	return map[string]string{

		"deckMode": "full",

		"drawMode": "sequential",

		"language": "ru",

		"deckStyle": "classic",
	}
}

// applyDeckMode пересобирает колоду
// под выбранный режим (full / major).

func (s *TarotService) applyDeckMode(
	mode string,
) {

	var cards []Card

	if mode == "major" {

		for _, c := range s.allCards {

			if c.IsMajor() {

				cards =
					append(
						cards,
						c,
					)

			}

		}

	} else {

		cards = s.allCards

	}

	s.deck =
		NewDeck(cards)

	s.deck.SetDrawMode(
		s.settings["drawMode"],
	)

}

// =====================================
// Настройки
// =====================================

// GetSettings возвращает все текущие настройки.
func (s *TarotService) GetSettings() map[string]string {

	return s.settings

}

// UpdateSetting сохраняет одну настройку и
// применяет её эффект (если применимо).

func (s *TarotService) UpdateSetting(
	key string,
	value string,
) {

	s.settings[key] = value

	if s.storage != nil {

		s.storage.SaveSetting(
			key,
			value,
		)

	}

	if key == "deckMode" {

		s.applyDeckMode(value)

	}

	if key == "drawMode" {

		s.deck.SetDrawMode(value)

	}

}

// =====================================
// Колода
// =====================================

// Shuffle восстановить и перемешать колоду.
func (s *TarotService) Shuffle() string {

	if s.deck == nil {

		return "Колода не загружена"

	}

	s.deck.Reset()

	s.deck.Shuffle()

	s.daily.Reset()

	return "Колода восстановлена и перемешана"
}

// ResetDeck восстановить колоду.
func (s *TarotService) ResetDeck() string {

	if s.deck == nil {

		return "Колода не загружена"

	}

	s.deck.Reset()

	s.deck.Shuffle()

	s.daily.Reset()

	return "Колода восстановлена"
}

// RemainingCards количество карт.
func (s *TarotService) RemainingCards() int {

	if s.deck == nil {

		return 0

	}

	return s.deck.Remaining()

}

// RemainingCardsList возвращает оставшиеся карты
// в текущем порядке колоды (как перетасованы).
func (s *TarotService) RemainingCardsList() []Card {

	if s.deck == nil {

		return nil

	}

	return s.deck.Cards()

}

// FullDeck возвращает полный классический набор
// из всех 78 карт, независимо от текущего режима.
func (s *TarotService) FullDeck() []Card {

	return s.allCards

}

// =====================================
// Карты
// =====================================

// drawOneCard вытягивает карту без сохранения в историю
// (используется как GetDailyCard, так и публичным DrawCard).
func (s *TarotService) drawOneCard() (*DrawnCard, error) {

	if s.deck == nil {

		return nil,
			fmt.Errorf(
				"колода не загружена",
			)

	}

	cards :=
		s.deck.Draw(1)

	if len(cards) == 0 {

		return nil,
			fmt.Errorf(
				"колода пуста",
			)

	}

	return &cards[0], nil
}

// DrawCard вытягивает одну карту и сохраняет её в историю.
func (s *TarotService) DrawCard() (*DrawnCard, error) {

	card, err :=
		s.drawOneCard()

	if err != nil {

		return nil, err

	}

	record :=
		s.history.AddSingle(
			*card,
		)

	if s.storage != nil {

		s.storage.SaveHistory(
			record,
		)

	}

	card.HistoryID = record.ID

	return card, nil

}

func (s *TarotService) DrawCards(
	count int,
) ([]DrawnCard, error) {

	if s.deck == nil {

		return nil,
			fmt.Errorf(
				"колода не загружена",
			)

	}

	result :=
		s.deck.Draw(count)

	if len(result) == 0 {

		return nil,
			fmt.Errorf(
				"нет карт",
			)

	}

	return result, nil
}

// =====================================
// Карта дня
// =====================================

func (s *TarotService) GetDailyCard() (*DailyCard, error) {

	if s.daily.HasToday() {

		return s.daily.Get(), nil

	}

	card, err :=
		s.drawOneCard()

	if err != nil {

		return nil, err

	}

	daily :=
		s.daily.Set(
			*card,
		)

	record :=
		s.history.AddDaily(
			*card,
		)

	if s.storage != nil {

		s.storage.SaveDaily(
			*daily,
		)

		s.storage.SaveHistory(
			record,
		)

	}

	card.HistoryID = record.ID

	daily.Card = *card

	return daily, nil

}

func (s *TarotService) GetDailyAnimation() *DailyAnimation {

	return s.daily.Animation()

}

func (s *TarotService) ResetDailyCard() {

	s.daily.Reset()

}

// =====================================
// Расклады
// =====================================

// GetSpreads список раскладов.

// GetSpreads список раскладов в фиксированном порядке.

func (s *TarotService) GetSpreads() []Spread {

	result :=
		make(
			[]Spread,
			0,
			len(SpreadOrder),
		)

	for _, id := range SpreadOrder {

		if spread, ok := Spreads[id]; ok {

			result =
				append(
					result,
					spread,
				)

		}

	}

	return result
}

// GetQuestions список вопросов по категориям.
func (s *TarotService) GetQuestions() []QuestionCategory {

	return s.questions

}

// GetGuide возвращает разделы руководства пользователя.
func (s *TarotService) GetGuide() []GuideSection {

	return s.guide

}

// GetAboutTarot возвращает справочные разделы о картах Таро.
func (s *TarotService) GetAboutTarot() []GuideSection {

	return s.aboutTarot

}

// GetLegal возвращает политику конфиденциальности и условия использования.
func (s *TarotService) GetLegal() *LegalDocs {

	return s.legal

}

// DrawSpread универсальный двигатель.
func (s *TarotService) DrawSpread(
	spreadID string,
	question string,
) (*SpreadResult, error) {

	if s.deck == nil {

		return nil,
			fmt.Errorf(
				"колода не загружена",
			)

	}

	spread, ok :=
		Spreads[spreadID]

	if !ok {

		return nil,
			fmt.Errorf(
				"расклад не найден: %s",
				spreadID,
			)

	}

	count :=
		len(spread.Positions)

	if count == 0 {

		return nil,
			fmt.Errorf(
				"пустой расклад",
			)

	}

	// если карт не хватает —
	// восстанавливаем колоду

	if s.deck.Remaining() < count {

		s.deck.Reset()

		s.deck.Shuffle()

	}

	drawn, err :=
		s.DrawCards(
			count,
		)

	if err != nil {

		return nil, err

	}

	result :=
		&SpreadResult{

			Spread: spread,

			Cards: make(
				[]SpreadCard,
				0,
				count,
			),
		}

	answers :=
		make(
			[]string,
			0,
			count,
		)

	for i, position := range spread.Positions {

		result.Cards =
			append(
				result.Cards,

				SpreadCard{

					Position: position,

					Card: drawn[i].Card,

					IsReversed: drawn[i].IsReversed,

					QuickAnswer: drawn[i].QuickAnswer,
				},
			)

		answers =
			append(
				answers,
				drawn[i].QuickAnswer,
			)

	}

	result.QuickAnswer =
		AggregateQuickAnswer(answers)

	s.lastSpread =
		&spread

	record :=
		s.history.AddSpread(
			result,
			question,
		)

	if s.storage != nil {

		s.storage.SaveHistory(
			record,
		)

	}

	result.HistoryID = record.ID

	return result, nil

}

func (s *TarotService) LastSpread() *Spread {

	return s.lastSpread

}

// =====================================
// История
// =====================================

func (s *TarotService) GetHistory() []HistoryRecord {

	return s.history.All()

}

func (s *TarotService) GetLastHistory(
	count int,
) []HistoryRecord {

	return s.history.Last(count)

}

func (s *TarotService) DeleteHistoryRecord(
	id int,
) {

	s.history.Delete(id)

	if s.storage != nil {

		s.storage.DeleteHistoryRecord(id)

	}

}

func (s *TarotService) UpdateHistoryComment(
	id int,
	comment string,
) {

	s.history.UpdateComment(id, comment)

	if s.storage != nil {

		s.storage.UpdateHistoryComment(id, comment)

	}

}

func (s *TarotService) ClearHistory() {

	s.history.Clear()

	if s.storage != nil {

		s.storage.ClearHistory()

	}

}

func (s *TarotService) HistoryCount() int {

	return s.history.Count()

}

// =====================================
// Информация
// =====================================

func (s *TarotService) Today() string {

	return time.Now().
		Format(
			"02.01.2006",
		)

}

func (s *TarotService) Status() map[string]interface{} {

	return map[string]interface{}{

		"cardsRemaining": s.RemainingCards(),

		"hasDailyCard": s.daily.HasToday(),

		"historyCount": s.HistoryCount(),

		"hasSpread": s.lastSpread != nil,
	}

}
