package tarot

// Старшие и младшие арканы

type Arcana string

const (
	Major Arcana = "major"

	Minor Arcana = "minor"
)

// Типы раскладов

type SpreadType string

const (
	SpreadSingle SpreadType = "single"

	SpreadThree SpreadType = "three"

	SpreadLove SpreadType = "love"

	SpreadChoice SpreadType = "choice"

	SpreadFinance SpreadType = "finance"

	SpreadCelticCross SpreadType = "celtic_cross"
)
