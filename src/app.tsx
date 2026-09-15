import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Folder,
  LayoutDashboard,
  ListTodo,
  Menu,
  Repeat2,
  Settings,
  X,
  LockKeyhole,
} from "lucide-react";
import { useSettings } from "./lib/use-settings";
import { errorMessage, useI18n } from "./lib/i18n";
import { useLocalClock, useNarrow } from "./lib/use-local-clock";
import {
  useSnapshot,
  useStorageError,
  useTracker,
} from "./features/tracker/provider";
import { CalendarPage, MiniCalendar } from "./features/planning/calendar-page";
import { HabitsPage } from "./features/habits/habits-page";
import { SettingsPage } from "./features/settings/settings-page";
import { TodoCard } from "./features/todo/todo-card";
import { BookmarkCard } from "./features/bookmarks/bookmark-card";
import { today } from "./features/planning/engine";
import { sampleSnapshot } from "./features/tracker/sample";
import { routes } from "./lib/routes";
import { RouteLink, useRoute } from "./lib/navigation";
export function App() {
  const s = useSnapshot(),
    store = useTracker(),
    error = useStorageError(),
    { settings } = useSettings(),
    { t, en } = useI18n(),
    narrow = useNarrow(),
    now = useLocalClock(),
    route = useRoute(),
    [date, setDate] = useState(today()),
    [menu, setMenu] = useState(false),
    previousDay = useRef(today()),
    toggle = useRef<HTMLButtonElement>(null),
    nav = useRef<HTMLElement>(null);
  const labels = {
      calendar: t("Lịch", "Calendar"),
      tasks: t("Công việc", "Tasks"),
      habits: t("Thói quen", "Habits"),
      resources: t("Tài nguyên", "Resources"),
      settings: t("Cài đặt", "Settings"),
    },
    icons = {
      calendar: CalendarDays,
      tasks: ListTodo,
      habits: Repeat2,
      resources: Folder,
      settings: Settings,
    };
  const pageTitle = route
    ? labels[route]
    : t("Không tìm thấy trang", "Page not found");
  useEffect(() => {
    setMenu(false);
  }, [route]);
  useEffect(() => {
    document.documentElement.lang = en ? "en" : "vi";
    document.title = pageTitle + " · " + settings.boardTitle;
  }, [en, pageTitle, settings.boardTitle]);
  useEffect(() => {
    const d = today(now),
      previous = previousDay.current;
    if (d !== previous) {
      setDate((current) => (current === previous ? d : current));
      previousDay.current = d;
    }
  }, [now]);
  useEffect(() => {
    if (!narrow) setMenu(false);
  }, [narrow]);
  useEffect(() => {
    if (!menu) return;
    const before = document.activeElement as HTMLElement;
    nav.current?.querySelector<HTMLElement>("button,a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
      if (e.key === "Tab") {
        const items = [
          ...nav.current!.querySelectorAll<HTMLElement>("a,button,input"),
        ].filter((e) => e.getClientRects().length);
        if (e.shiftKey && document.activeElement === items[0]) {
          e.preventDefault();
          items.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
          e.preventDefault();
          items[0]?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      before?.focus();
    };
  }, [menu]);
  const collapsed = !narrow && s.preferences.sidebarCollapsed;
  return (
    <div className={`v2-app ${collapsed ? "nav-collapsed" : ""}`}>
      {menu && (
        <button
          className="v2-nav-backdrop"
          aria-label={t("Đóng menu", "Close menu")}
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        ref={nav}
        className={"v2-sidebar " + (menu ? "open" : "")}
        inert={narrow && !menu}
      >
        <div className="v2-brand">
          <RouteLink
            to="calendar"
            aria-label={settings.boardTitle}
            onClick={() => setMenu(false)}
          >
            <LayoutDashboard size={21} />
            <span>{settings.boardTitle}</span>
          </RouteLink>
          {narrow && (
            <button
              onClick={() => setMenu(false)}
              aria-label={t("Đóng menu", "Close menu")}
            >
              <X size={18} />
            </button>
          )}
        </div>
        <nav aria-label={t("Module chính", "Main navigation")}>
          {routes
            .filter((r) => r !== "settings")
            .map((r) => {
              const Icon = icons[r];
              return (
                <RouteLink
                  key={r}
                  to={r}
                  onClick={() => setMenu(false)}
                  title={labels[r]}
                  aria-label={labels[r]}
                  aria-current={route === r ? "page" : undefined}
                >
                  <Icon size={19} />
                  <span>{labels[r]}</span>
                </RouteLink>
              );
            })}
        </nav>
        {route === "calendar" && (
          <MiniCalendar
            date={date}
            onChange={(d) => {
              setDate(d);
              if (narrow) setMenu(false);
            }}
          />
        )}
        <div className="v2-sidebar-bottom">
          <nav>
            <RouteLink
              to="settings"
              onClick={() => setMenu(false)}
              title={labels.settings}
              aria-label={labels.settings}
              aria-current={route === "settings" ? "page" : undefined}
            >
              <Settings size={19} />
              <span>{labels.settings}</span>
            </RouteLink>
          </nav>
          <p>
            <LockKeyhole size={14} />
            <span>{t("Lưu trên thiết bị này", "Stored on this device")}</span>
          </p>
        </div>
      </aside>
      <main className="v2-main" inert={menu}>
        <header className="v2-topbar">
          <button
            ref={toggle}
            aria-label={t("Thu gọn / mở menu", "Toggle navigation")}
            aria-expanded={narrow ? menu : !collapsed}
            onClick={() =>
              narrow
                ? setMenu(!menu)
                : store.commit((n) => {
                    n.preferences.sidebarCollapsed =
                      !n.preferences.sidebarCollapsed;
                  })
            }
          >
            <Menu size={19} />
          </button>
          <h1>{pageTitle}</h1>
          <select
            aria-label={t("Ngôn ngữ", "Language")}
            value={s.settings.language}
            onChange={(e) =>
              store.commit((n) => {
                n.settings.language = e.target.value as "vi" | "en";
              })
            }
          >
            <option value="vi">VI</option>
            <option value="en">EN</option>
          </select>
        </header>
        {!s.welcomed && (
          <div className="v2-welcome">
            <span>
              {t(
                "Bắt đầu với lịch trống hoặc nạp dữ liệu mẫu để khám phá.",
                "Start with an empty calendar or load sample data to explore.",
              )}
            </span>
            <button
              onClick={() =>
                store.commit((n) => {
                  n.welcomed = true;
                })
              }
            >
              {t("Dùng lịch trống", "Start empty")}
            </button>
            <button
              onClick={() =>
                store.commit((n) => Object.assign(n, sampleSnapshot(n)))
              }
            >
              {t("Nạp mẫu", "Load sample")}
            </button>
          </div>
        )}
        {route === "calendar" ? (
          <CalendarPage date={date} setDate={setDate} now={now} />
        ) : route === "tasks" ? (
          <div className="v2-module-content">
            <TodoCard
              archiveDays={settings.archiveDays}
              className="h-full min-h-0 border-0"
            />
          </div>
        ) : route === "habits" ? (
          <HabitsPage now={now} />
        ) : route === "resources" ? (
          <div className="v2-module-content">
            <BookmarkCard className="h-full min-h-0 border-0" />
          </div>
        ) : route === "settings" ? (
          <SettingsPage />
        ) : (
          <section className="v2-empty">
            <h2>
              {t("Trang này không tồn tại.", "This page does not exist.")}
            </h2>
            <RouteLink to="calendar">
              {t("Về Calendar", "Back to Calendar")}
            </RouteLink>
          </section>
        )}
        <footer className="v2-footer">
          {t(
            "Dữ liệu cá nhân • Lưu trong trình duyệt",
            "Personal data • Stored in this browser",
          )}
        </footer>
      </main>
      {error && (
        <div className="v2-storage-error" role="alert">
          <span>{errorMessage(error, en)}</span>
          <button onClick={store.clearError} aria-label={t("Đóng", "Close")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
