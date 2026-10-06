package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist

var assets embed.FS

func main() {

	tarotService :=
		NewTarotService()

	app :=
		application.New(
			application.Options{

				Name: "Tarot Oracle",

				Description: "Приложение для гаданий на картах Таро",

				Services: []application.Service{

					application.NewService(
						tarotService,
					),
				},

				Assets: application.AssetOptions{

					Handler: application.AssetFileServerFS(
						assets,
					),
				},

				Mac: application.MacOptions{

					ApplicationShouldTerminateAfterLastWindowClosed: true,
				},
			},
		)

	app.Window.NewWithOptions(
		application.WebviewWindowOptions{

			Title: "Tarot Oracle",

			Width: 1024,

			Height: 768,

			BackgroundColour: application.NewRGB(
				27,
				38,
				54,
			),

			URL: "/",
		},
	)

	err :=
		app.Run()

	if err != nil {

		log.Fatal(err)

	}

}
