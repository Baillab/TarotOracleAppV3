package tarot

import (
	"time"
)

// HistoryRecord одна запись истории.
type HistoryRecord struct {
	ID int `json:"id"`

	Date time.Time `json:"date"`

	// spread / daily / single
	Type string `json:"type"`

	Name string `json:"name"`

	SpreadID string `json:"spreadId,omitempty"`

	Question string `json:"question"`

	Comment string `json:"comment,omitempty"`

	Cards []DrawnCard `json:"cards"`
}

// History история гаданий.
type History struct {
	records []HistoryRecord

	nextID int
}

func NewHistory() *History {

	return &History{

		records: make(
			[]HistoryRecord,
			0,
		),

		nextID: 1,
	}
}

func (h *History) Add(
	record HistoryRecord,
) HistoryRecord {

	record.ID = h.nextID

	record.Date = time.Now()

	h.nextID++

	h.records =
		append(
			h.records,
			record,
		)

	return record
}

// AddSpread сохраняет результат расклада.
func (h *History) AddSpread(
	result *SpreadResult,
	question string,
) HistoryRecord {

	cards :=
		make(
			[]DrawnCard,
			0,
			len(result.Cards),
		)

	for _, item := range result.Cards {

		cards =
			append(
				cards,

				DrawnCard{

					Card: item.Card,

					IsReversed: item.IsReversed,

					QuickAnswer: item.QuickAnswer,
				},
			)

	}

	return h.Add(
		HistoryRecord{

			Type: "spread",

			Name: result.Spread.Name,

			SpreadID: result.Spread.ID,

			Question: question,

			Cards: cards,
		},
	)
}

// AddSingle сохраняет одиночную вытянутую карту.
func (h *History) AddSingle(
	card DrawnCard,
) HistoryRecord {

	return h.Add(
		HistoryRecord{

			Type: "single",

			Name: "Вытянутая карта",

			Cards: []DrawnCard{
				card,
			},
		},
	)
}

func (h *History) AddDaily(
	card DrawnCard,
) HistoryRecord {

	return h.Add(
		HistoryRecord{

			Type: "daily",

			Name: "Карта дня",

			Cards: []DrawnCard{
				card,
			},
		},
	)
}

func (h *History) All() []HistoryRecord {

	result :=
		make(
			[]HistoryRecord,
			len(h.records),
		)

	copy(
		result,
		h.records,
	)

	return result
}

func (h *History) Last(
	count int,
) []HistoryRecord {

	if count <= 0 {

		return nil
	}

	if count > len(h.records) {

		count = len(h.records)

	}

	start :=
		len(h.records) - count

	result :=
		make(
			[]HistoryRecord,
			count,
		)

	copy(
		result,
		h.records[start:],
	)

	return result
}

// Delete удаляет запись по ID.
func (h *History) Delete(
	id int,
) {

	filtered :=
		make(
			[]HistoryRecord,
			0,
			len(h.records),
		)

	for _, r := range h.records {

		if r.ID != id {

			filtered =
				append(
					filtered,
					r,
				)

		}

	}

	h.records = filtered

}

// UpdateComment обновляет комментарий записи по ID.
func (h *History) UpdateComment(
	id int,
	comment string,
) {

	for i := range h.records {

		if h.records[i].ID == id {

			h.records[i].Comment = comment

			return

		}

	}

}

func (h *History) Clear() {

	h.records =
		make(
			[]HistoryRecord,
			0,
		)

	h.nextID = 1
}

func (h *History) Count() int {

	return len(h.records)

}

// Restore добавляет запись, загруженную из хранилища,
// сохраняя её оригинальные ID и Date (в отличие от Add).
func (h *History) Restore(
	record HistoryRecord,
) {

	h.records =
		append(
			h.records,
			record,
		)

	if record.ID >= h.nextID {

		h.nextID = record.ID + 1

	}
}
