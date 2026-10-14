package main

import (
	"os"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// Quit полностью закрывает приложение (кнопка ✕ в интерфейсе).
//
// На десктопе достаточно app.Quit(). На Android он может не завершить
// процесс, поэтому через короткую паузу — os.Exit(0): процесс
// завершается, и приложение не остаётся висеть в фоне.
func (a *TarotService) Quit() {

	go func() {

		if app := application.Get(); app != nil {

			app.Quit()

		}

		time.Sleep(400 * time.Millisecond)

		os.Exit(0)

	}()

}
