//go:build windows

package main

import (
	"embed"
	"errors"
	"flag"
	"io/fs"
	"log"
	"math"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
	"unsafe"

	"github.com/jchv/go-webview2"
	"golang.org/x/sys/windows"
)

//go:embed all:www
var www embed.FS

const listenAddr = "127.0.0.1:17831"
const origin = "http://127.0.0.1:17831"

const inject = `
window.todoingDesktop = {
  desktop: true,
  openWidget: function(kind) { return window.__todoingOpenWidget(kind); },
  openExternal: function(url) { return window.__todoingOpenExternal(url); }
};
window.open = function(url) {
  try {
    var u = new URL(url, location.href);
    if (u.origin === location.origin) {
      var m = u.pathname.match(/\/widget\/(day|week|pomodoro)/);
      if (m) { window.__todoingOpenWidget(m[1]); return null; }
      return null;
    }
    if (/^https?:/i.test(u.href)) { window.__todoingOpenExternal(u.href); return null; }
  } catch (e) {}
  return null;
};
document.addEventListener("click", function(e) {
  var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
  if (!a) return;
  var href = a.href;
  if (/^https?:/i.test(href) && href.indexOf(location.origin) !== 0) {
    e.preventDefault();
    window.__todoingOpenExternal(href);
  }
}, true);
`

type windowSpec struct {
	title  string
	path   string
	width  int
	height int
	minW   int
	minH   int
}

func specFor(widget string) windowSpec {
	switch widget {
	case "day":
		return windowSpec{"我的一天 · Todoing", "/widget/day", 360, 580, 300, 420}
	case "week":
		return windowSpec{"我的一周 · Todoing", "/widget/week", 420, 680, 320, 480}
	case "pomodoro":
		return windowSpec{"番茄钟 · Todoing", "/widget/pomodoro", 340, 480, 300, 400}
	default:
		return windowSpec{"Todoing", "/", 1280, 820, 390, 640}
	}
}

func main() {
	widget := flag.String("widget", "", "day | week | pomodoro")
	flag.Parse()

	enableDPIAwareness()
	_ = setAppUserModelID("com.todoing.app")
	startFileServer()

	spec := specFor(*widget)
	scale := systemScale()
	width := scaled(spec.width, scale)
	height := scaled(spec.height, scale)
	minW := scaled(spec.minW, scale)
	minH := scaled(spec.minH, scale)

	dataDir := filepath.Join(os.Getenv("LOCALAPPDATA"), "Todoing", "wvdata")
	_ = os.MkdirAll(dataDir, 0o755)

	w := webview2.NewWithOptions(webview2.WebViewOptions{
		Debug:     false,
		AutoFocus: true,
		DataPath:  dataDir,
		WindowOptions: webview2.WindowOptions{
			Title:  spec.title,
			Width:  uint(width),
			Height: uint(height),
			Center: true,
			IconId: 1,
		},
	})
	if w == nil {
		alert("Todoing", "无法启动。请先安装 Microsoft Edge WebView2 运行时（Windows 11 已自带，Windows 10 请安装 Edge）。")
		os.Exit(1)
	}
	defer w.Destroy()

	w.SetSize(width, height, webview2.HintNone)
	w.SetSize(minW, minH, webview2.HintMin)
	if err := w.Bind("__todoingOpenWidget", openWidget); err != nil {
		log.Println("bind openWidget:", err)
	}
	if err := w.Bind("__todoingOpenExternal", openExternal); err != nil {
		log.Println("bind openExternal:", err)
	}
	w.Init(inject)
	w.Navigate(origin + spec.path)
	w.Run()
}

func startFileServer() {
	root, err := fs.Sub(www, "www")
	if err != nil {
		log.Fatal(err)
	}
	ln, err := net.Listen("tcp", listenAddr)
	if err != nil {
		// Another Todoing window already serves this origin — reuse it.
		return
	}
	go func() {
		if err := http.Serve(ln, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			serveWWW(root, w, r)
		})); err != nil {
			log.Println("http:", err)
		}
	}()
}

func serveWWW(root fs.FS, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	clean := path.Clean("/" + r.URL.Path)
	if strings.Contains(clean, "..") {
		http.NotFound(w, r)
		return
	}
	rel := strings.TrimPrefix(clean, "/")
	candidates := []string{}
	if rel == "" || rel == "." {
		candidates = []string{"index.html"}
	} else {
		candidates = []string{rel, rel + ".html", rel + "/index.html"}
	}
	for _, name := range candidates {
		data, err := fs.ReadFile(root, name)
		if err != nil {
			continue
		}
		w.Header().Set("Content-Type", mimeOf(name))
		w.Header().Set("Cache-Control", cacheOf(name))
		_, _ = w.Write(data)
		return
	}
	http.NotFound(w, r)
}

func mimeOf(name string) string {
	switch path.Ext(name) {
	case ".html":
		return "text/html; charset=utf-8"
	case ".js", ".mjs":
		return "text/javascript; charset=utf-8"
	case ".css":
		return "text/css; charset=utf-8"
	case ".svg":
		return "image/svg+xml"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".ico":
		return "image/x-icon"
	case ".woff2":
		return "font/woff2"
	case ".json", ".map":
		return "application/json"
	case ".webmanifest":
		return "application/manifest+json"
	default:
		return "application/octet-stream"
	}
}

func cacheOf(name string) string {
	if strings.HasPrefix(name, "assets/") {
		return "public, max-age=31536000, immutable"
	}
	return "no-cache"
}

func openWidget(kind string) error {
	switch kind {
	case "day", "week", "pomodoro":
	default:
		return errors.New("unknown widget")
	}
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	cmd := exec.Command(exe, "--widget", kind)
	cmd.Dir = filepath.Dir(exe)
	return cmd.Start()
}

func openExternal(raw string) error {
	if !strings.HasPrefix(raw, "https://") && !strings.HasPrefix(raw, "http://") {
		return errors.New("blocked")
	}
	return exec.Command("rundll32", "url.dll,FileProtocolHandler", raw).Start()
}

func enableDPIAwareness() {
	user32 := windows.NewLazySystemDLL("user32.dll")
	setCtx := user32.NewProc("SetProcessDpiAwarenessContext")
	if setCtx.Find() == nil {
		// DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = -4
		_, _, _ = setCtx.Call(^uintptr(3))
		return
	}
	shcore := windows.NewLazySystemDLL("shcore.dll")
	setAware := shcore.NewProc("SetProcessDpiAwareness")
	if setAware.Find() == nil {
		_, _, _ = setAware.Call(2) // PROCESS_PER_MONITOR_DPI_AWARE
	}
}

func systemScale() float64 {
	user32 := windows.NewLazySystemDLL("user32.dll")
	getDpi := user32.NewProc("GetDpiForSystem")
	if getDpi.Find() != nil {
		return 1
	}
	dpi, _, _ := getDpi.Call()
	if dpi == 0 {
		return 1
	}
	scale := float64(dpi) / 96
	if scale < 1 {
		return 1
	}
	return scale
}

func scaled(px int, scale float64) int {
	return int(math.Round(float64(px) * scale))
}

func setAppUserModelID(id string) error {
	shell32 := windows.NewLazySystemDLL("shell32.dll")
	proc := shell32.NewProc("SetCurrentProcessExplicitAppUserModelID")
	ptr, err := windows.UTF16PtrFromString(id)
	if err != nil {
		return err
	}
	r, _, last := proc.Call(uintptr(unsafe.Pointer(ptr)))
	if r != 0 {
		return last
	}
	return nil
}

func alert(title, body string) {
	t, _ := windows.UTF16PtrFromString(title)
	b, _ := windows.UTF16PtrFromString(body)
	user32 := windows.NewLazySystemDLL("user32.dll")
	user32.NewProc("MessageBoxW").Call(0, uintptr(unsafe.Pointer(b)), uintptr(unsafe.Pointer(t)), 0x10)
}
