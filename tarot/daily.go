package tarot

import (
	"time"
)

// DailyCard хранит карту дня.
type DailyCard struct {

	// Дата получения
	Date string `json:"date"`

	// Выпавшая карта
	Card DrawnCard `json:"card"`

	// Текст для экрана
	Message string `json:"message"`
}

// IsToday проверяет,
// относится ли карта к сегодняшнему дню.
func (d DailyCard) IsToday() bool {

	today :=
		time.Now().
			Format("2006-01-02")

	return d.Date == today
}

// DailyManager управляет картой дня.
type DailyManager struct {
	card *DailyCard
}

// NewDailyManager создаёт менеджер.
func NewDailyManager() *DailyManager {

	return &DailyManager{}
}

// Get возвращает текущую карту дня.
func (m *DailyManager) Get() *DailyCard {

	if m.card == nil {
		return nil
	}

	return m.card
}

// Set сохраняет карту дня.
func (m *DailyManager) Set(
	card DrawnCard,
) *DailyCard {

	m.card = &DailyCard{

		Date: time.Now().
			Format("2006-01-02"),

		Card: card,

		Message: "Ваша карта дня",
	}

	return m.card
}

// Reset удаляет карту дня.
func (m *DailyManager) Reset() {

	m.card = nil
}

// HasToday проверяет,
// была ли уже вытянута карта сегодня.
func (m *DailyManager) HasToday() bool {

	if m.card == nil {

		return false
	}

	return m.card.IsToday()
}

// =====================================
// Данные для анимации Wails
// =====================================

// DailyAnimation описание появления карты дня.
type DailyAnimation struct {
	Card DailyCard `json:"card"`

	// Откуда появляется карта

	StartX float64 `json:"startX"`

	StartY float64 `json:"startY"`

	StartScale float64 `json:"startScale"`

	// Куда приходит

	X float64 `json:"x"`

	Y float64 `json:"y"`

	Scale float64 `json:"scale"`

	Rotation float64 `json:"rotation"`

	// Анимация

	Delay int `json:"delay"`

	Duration int `json:"duration"`

	Glow bool `json:"glow"`

	Particles bool `json:"particles"`
}

// Animation возвращает сцену
// появления карты дня.
func (m *DailyManager) Animation() *DailyAnimation {

	if m.card == nil {

		return nil
	}

	return &DailyAnimation{

		Card: *m.card,

		StartX: 0,

		StartY: 450,

		StartScale: 0.2,

		X: 0,

		Y: 0,

		Scale: 1.15,

		Rotation: 0,

		Delay: 0,

		Duration: 1200,

		Glow: true,

		Particles: true,
	}
}
