package main

import (
	"os"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// Quit полностью закрывает приложение (кнопка ✕ в интерфейсе).
//
// Сначала штатное завершение app.Quit() — оно закрывает окно плавно.
// Если за 2 секунды процесс всё ещё жив (на Android Quit может ничего
// не сделать), — крайняя мера os.Exit(0), чтобы приложение не висело
// в фоне. Жёсткий os.Exit и даёт «дёрганье» экрана, поэтому он последний.
func (a *TarotService) Quit() {

	go func() {

		if app := application.Get(); app != nil {

			app.Quit()

		}

		time.Sleep(2 * time.Second)

		os.Exit(0)

	}()

}
