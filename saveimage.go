package main

import (
	"encoding/base64"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// SaveImage сохраняет PNG (приходит из интерфейса в base64) в папку
// «Загрузки» пользователя и возвращает полный путь к файлу.
//
// На Android обычный Go-код не может записать файл в общую папку
// (нужен MediaStore из Java), поэтому там возвращается ошибка —
// интерфейс в этом случае открывает системное меню «Поделиться».
func (a *TarotService) SaveImage(name string, dataBase64 string) (string, error) {

	if runtime.GOOS == "android" || runtime.GOOS == "ios" {

		return "", errors.New("сохранение файла недоступно на этой платформе")

	}

	data, err := base64.StdEncoding.DecodeString(dataBase64)

	if err != nil {

		return "", err

	}

	if len(data) == 0 {

		return "", errors.New("пустое изображение")

	}

	// только имя файла, без путей; расширение всегда .png
	name = filepath.Base(strings.TrimSpace(name))

	if name == "" || name == "." || name == string(filepath.Separator) {

		name = "Tarot.png"

	}

	if !strings.HasSuffix(strings.ToLower(name), ".png") {

		name += ".png"

	}

	home, err := os.UserHomeDir()

	if err != nil {

		return "", err

	}

	dir := filepath.Join(home, "Downloads")

	if st, err := os.Stat(dir); err != nil || !st.IsDir() {

		dir = home

	}

	path := filepath.Join(dir, name)

	// не затираем существующие файлы: Tarot.png, Tarot_1.png, ...
	ext := filepath.Ext(path)

	base := strings.TrimSuffix(path, ext)

	for i := 1; ; i++ {

		if _, err := os.Stat(path); os.IsNotExist(err) {

			break

		}

		path = base + "_" + itoa(i) + ext

	}

	if err := os.WriteFile(path, data, 0o644); err != nil {

		return "", err

	}

	return path, nil

}

func itoa(n int) string {

	if n == 0 {

		return "0"

	}

	var b [20]byte

	i := len(b)

	for n > 0 {

		i--

		b[i] = byte('0' + n%10)

		n /= 10

	}

	return string(b[i:])

}
