import { motion } from "motion/react";
import { useState } from "react";
import { DashboardHeader } from "./components/dashboard-header";
import { SettingsModal } from "./components/settings-modal";
import { StorageAlert } from "./components/storage-alert";
import { WelcomeModal } from "./components/welcome-modal";
import { useLocalStorage } from "./lib/use-local-storage";
import { useSettings } from "./lib/use-settings";
import { BookmarkCard } from "./features/bookmarks/bookmark-card";
import { HabitCard } from "./features/habits/habit-card";
import { TodoCard } from "./features/todo/todo-card";

/**
 * Bento dashboard shell: a photographic background, a translucent padded
 * container with a page header. Todo is the dominant work area; the right
 * column keeps reusable resources and recurring habits close at hand.
 * Personalization lives in settings and is applied to the DOM by useSettings.
 */
export function App() {
  const { settings, update } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [welcomed, setWelcomed] = useLocalStorage("pt.welcomed", false);

  return (
    <div className="min-h-screen p-2">
      <div className="flex flex-col gap-2 rounded-[1rem] border border-line bg-shell p-2 backdrop-blur-sm lg:h-[calc(100dvh-1rem)]">
        <DashboardHeader
          title={settings.boardTitle}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
        >
          <TodoCard
            className="min-h-[540px] lg:min-h-0"
            archiveDays={settings.archiveDays}
          />

          <div className="flex min-h-0 flex-col gap-2">
            <BookmarkCard className="min-h-[320px] lg:min-h-0 lg:flex-[3]" />
            <HabitCard className="min-h-[320px] lg:min-h-0 lg:flex-[2]" />
          </div>
        </motion.div>
      </div>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onUpdate={update}
      />

      <WelcomeModal open={!welcomed} onClose={() => setWelcomed(true)} />

      <StorageAlert />
    </div>
  );
}
