//go:build linux && !android

package main

import "os"

// На Chromebook (WebKitGTK без GPU) стандартный рендеринг даёт рывки.
// Эти переменные должны быть заданы до старта WebKit; если пользователь
// уже задал их сам (например, в ярлыке), его значения не трогаем.
func init() {
	for _, k := range []string{
		"WEBKIT_DISABLE_COMPOSITING_MODE",
		"WEBKIT_DISABLE_DMABUF_RENDERER",
	} {
		if _, ok := os.LookupEnv(k); !ok {
			os.Setenv(k, "1")
		}
	}
}
