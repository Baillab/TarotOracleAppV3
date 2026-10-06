package tarot

type CardMeaning struct {
	Text    string `json:"text"`
	Love    string `json:"love"`
	Career  string `json:"career"`
	Finance string `json:"finance"`
	Health  string `json:"health"`
	Advice  string `json:"advice"`
}

type Card struct {
	ID string `json:"id"`

	Name string `json:"name"`

	Arcana Arcana `json:"arcana"`

	Number int `json:"number"`

	// Для младших арканов:
	// wands, cups, swords, pentacles
	Suit string `json:"suit,omitempty"`

	Image string `json:"image"`

	Keywords []string `json:"keywords"`

	Upright CardMeaning `json:"upright"`

	Reversed CardMeaning `json:"reversed"`
}

func (c Card) IsMajor() bool {
	return c.Arcana == Major
}

func (c Card) IsMinor() bool {
	return c.Arcana == Minor
}
