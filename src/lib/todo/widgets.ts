export type WidgetKind = "day" | "week" | "pomodoro";

export const WIDGET_PATH: Record<WidgetKind, string> = {
  day: "/widget/day",
  week: "/widget/week",
  pomodoro: "/widget/pomodoro",
};

export const WIDGET_FEATURES: Record<WidgetKind, string> = {
  day: "popup=yes,width=360,height=580,resizable=yes",
  week: "popup=yes,width=420,height=680,resizable=yes",
  pomodoro: "popup=yes,width=340,height=480,resizable=yes",
};

type DesktopBridge = {
  desktop?: boolean;
  openWidget?: (kind: WidgetKind) => void;
};

function desktopBridge(): DesktopBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { todoingDesktop?: DesktopBridge }).todoingDesktop;
}

export function openWidgetWindow(kind: WidgetKind): boolean {
  if (typeof window === "undefined") return false;
  const bridge = desktopBridge();
  if (bridge?.openWidget) {
    bridge.openWidget(kind);
    return true;
  }
  const popup = window.open(WIDGET_PATH[kind], `todoing-widget-${kind}`, WIDGET_FEATURES[kind]);
  return Boolean(popup && !popup.closed);
}

export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  if (desktopBridge()?.desktop) return true;
  if ("todoingDesktop" in window) return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function openWindowsInstall() {
  if (typeof window === "undefined") return;
  window.location.assign("/?install=1");
}
