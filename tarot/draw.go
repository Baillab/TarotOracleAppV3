package tarot

// DrawnCard представляет карту,
// вытянутую из колоды.

type DrawnCard struct {
	Card        Card   `json:"card"`
	IsReversed  bool   `json:"isReversed"`
	QuickAnswer string `json:"quickAnswer,omitempty"`
	HistoryID   int    `json:"historyId,omitempty"`
}

// Position возвращает положение карты.
func (d DrawnCard) Position() string {
	if d.IsReversed {
		return "Перевернутая"
	}
	return "Прямая"
}

// Meaning возвращает описание карты
// в зависимости от её положения.
func (d DrawnCard) Meaning() CardMeaning {
	if d.IsReversed {
		return d.Card.Reversed
	}
	return d.Card.Upright
}
