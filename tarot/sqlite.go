package tarot

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

// SQLiteStorage работа с базой данных.
type SQLiteStorage struct {
	db *sql.DB
}

// NewSQLiteStorage открывает базу.
func NewSQLiteStorage(
	path string,
) (*SQLiteStorage, error) {

	db, err :=
		sql.Open(
			"sqlite",
			path,
		)

	if err != nil {

		return nil, err
	}

	storage :=
		&SQLiteStorage{
			db: db,
		}

	if err :=
		storage.createTables(); err != nil {

		return nil, err
	}

	return storage, nil
}

// createTables создаёт таблицы.
func (s *SQLiteStorage) createTables() error {

	query := `


CREATE TABLE IF NOT EXISTS history (

	id INTEGER PRIMARY KEY AUTOINCREMENT,

	date TEXT NOT NULL,

	type TEXT NOT NULL,

	name TEXT,

	spread_id TEXT,

	question TEXT,

	comment TEXT,

	cards TEXT NOT NULL

);



CREATE TABLE IF NOT EXISTS daily_card (

	id INTEGER PRIMARY KEY,

	date TEXT NOT NULL,

	card TEXT NOT NULL

);


CREATE TABLE IF NOT EXISTS settings (

	key TEXT PRIMARY KEY,

	value TEXT NOT NULL

);

`

	// Миграция: добавляем колонку comment,
	// если её ещё нет (для существующих баз).
	_, _ = s.db.Exec(
		"ALTER TABLE history ADD COLUMN comment TEXT",
	)

	// Миграция: добавляем колонку spread_id,
	// если её ещё нет (для существующих баз).
	_, _ = s.db.Exec(
		"ALTER TABLE history ADD COLUMN spread_id TEXT",
	)

	_, err :=
		s.db.Exec(query)

	return err
}

// =====================================
// История
// ====================================

func (s *SQLiteStorage) SaveHistory(
	record HistoryRecord,
) error {

	data, err :=
		json.Marshal(
			record.Cards,
		)

	if err != nil {

		return err
	}

	_, err =
		s.db.Exec(

			`
			INSERT INTO history
			(
				date,
				type,
				name,
				spread_id,
				question,
				comment,
				cards
			)

			VALUES
			(?,?,?,?,?,?,?)
			`,

			record.Date.Format(
				time.RFC3339,
			),

			record.Type,

			record.Name,

			record.SpreadID,

			record.Question,

			record.Comment,

			string(data),
		)

	return err
}

// UpdateHistoryComment обновляет комментарий одной записи.
func (s *SQLiteStorage) UpdateHistoryComment(
	id int,
	comment string,
) error {

	_, err :=
		s.db.Exec(
			"UPDATE history SET comment = ? WHERE id = ?",
			comment,
			id,
		)

	return err
}

// LoadHistory загружает историю.
func (s *SQLiteStorage) LoadHistory() (
	[]HistoryRecord,
	error,
) {

	rows, err :=
		s.db.Query(

			`
			SELECT
				id,
				date,
				type,
				name,
				spread_id,
				question,
				comment,
				cards

			FROM history

			ORDER BY id ASC
			`,
		)

	if err != nil {

		return nil, err
	}

	defer rows.Close()

	result :=
		make(
			[]HistoryRecord,
			0,
		)

	for rows.Next() {

		var (
			record HistoryRecord

			date string

			spreadID sql.NullString

			comment sql.NullString

			cards string
		)

		err =
			rows.Scan(

				&record.ID,

				&date,

				&record.Type,

				&record.Name,

				&spreadID,

				&record.Question,

				&comment,

				&cards,
			)

		if err != nil {

			return nil, err
		}

		record.Date, _ =
			time.Parse(
				time.RFC3339,
				date,
			)

		record.SpreadID =
			spreadID.String

		record.Comment =
			comment.String

		json.Unmarshal(
			[]byte(cards),
			&record.Cards,
		)

		result =
			append(
				result,
				record,
			)
	}

	return result, nil
}

// DeleteHistoryRecord удаляет одну запись по ID.
func (s *SQLiteStorage) DeleteHistoryRecord(
	id int,
) error {

	_, err :=
		s.db.Exec(
			"DELETE FROM history WHERE id = ?",
			id,
		)

	return err
}

// ClearHistory удалить историю.
func (s *SQLiteStorage) ClearHistory() error {

	_, err :=
		s.db.Exec(
			"DELETE FROM history",
		)

	return err
}

// =====================================
// Карта дня
// =====================================

// SaveDaily сохраняет карту дня.
func (s *SQLiteStorage) SaveDaily(
	daily DailyCard,
) error {

	data, err :=
		json.Marshal(
			daily.Card,
		)

	if err != nil {

		return err
	}

	_, err =
		s.db.Exec(

			`
			INSERT OR REPLACE INTO daily_card
			(
				id,
				date,
				card
			)

			VALUES
			(
				1,
				?,
				?
			)
			`,

			daily.Date,

			string(data),
		)

	return err
}

// LoadDaily загрузить карту дня.
func (s *SQLiteStorage) LoadDaily() (
	*DailyCard,
	error,
) {

	var (
		date string

		cardJSON string
	)

	err :=
		s.db.QueryRow(

			`
			SELECT
				date,
				card

			FROM daily_card

			WHERE id = 1
			`,
		).Scan(

			&date,

			&cardJSON,
		)

	if err == sql.ErrNoRows {

		return nil, nil
	}

	if err != nil {

		return nil, err
	}

	var card DrawnCard

	err =
		json.Unmarshal(
			[]byte(cardJSON),
			&card,
		)

	if err != nil {

		return nil, err
	}

	return &DailyCard{

		Date: date,

		Card: card,

		Message: "Ваша карта дня",
	}, nil
}

// =====================================
// Настройки
// =====================================

// SaveSetting сохраняет (или обновляет) одну настройку.
func (s *SQLiteStorage) SaveSetting(
	key string,
	value string,
) error {

	_, err :=
		s.db.Exec(

			`
			INSERT INTO settings (key, value)

			VALUES (?, ?)

			ON CONFLICT(key) DO UPDATE SET value = excluded.value
			`,

			key,

			value,
		)

	return err
}

// LoadSettings загружает все настройки.
func (s *SQLiteStorage) LoadSettings() (
	map[string]string,
	error,
) {

	rows, err :=
		s.db.Query(
			"SELECT key, value FROM settings",
		)

	if err != nil {

		return nil, err

	}

	defer rows.Close()

	result :=
		make(
			map[string]string,
		)

	for rows.Next() {

		var key, value string

		if err := rows.Scan(&key, &value); err != nil {

			return nil, err

		}

		result[key] = value

	}

	return result, nil
}

// Close закрывает базу.
func (s *SQLiteStorage) Close() error {

	if s.db == nil {

		return fmt.Errorf(
			"база не открыта",
		)
	}

	return s.db.Close()
}
