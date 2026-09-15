import { createId } from "../../lib/id";
import { useLocalStorage } from "../../lib/use-local-storage";
import { normalizeUrl, titleFromUrl } from "../../lib/url";

export type Bookmark = {
  id: string;
  url: string;
  title: string;
  /** Empty string means "ungrouped". */
  group: string;
  createdAt: number;
};

export type BookmarkDraft = { url: string; title: string; group: string };

/**
 * Bookmark store. Groups are first-class entities (their own list) so a group
 * can be created/kept independently of whether any bookmark uses it.
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>(
    "pt.bookmarks",
    [],
  );
  const [groups, setGroups] = useLocalStorage<string[]>(
    "pt.bookmark-groups",
    [],
  );

  function addGroup(name: string) {
    const clean = name.trim();
    if (!clean) return;
    setGroups((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  }

  function addBookmark(draft: BookmarkDraft) {
    const url = normalizeUrl(draft.url);
    if (!url) return;
    const group = draft.group.trim();
    if (group) addGroup(group);
    setBookmarks((prev) => [
      {
        id: createId(),
        url,
        title: draft.title.trim() || titleFromUrl(url),
        group,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
  }

  function removeBookmark(id: string) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  /** Delete a group entity and detach any bookmarks that referenced it. */
  function removeGroup(name: string) {
    setGroups((prev) => prev.filter((g) => g !== name));
    setBookmarks((prev) =>
      prev.map((b) => (b.group === name ? { ...b, group: "" } : b)),
    );
  }

  /** Rename a group and re-point every bookmark that used the old name. */
  function renameGroup(from: string, to: string) {
    const clean = to.trim();
    if (!clean || clean === from || groups.includes(clean)) return;
    setGroups((prev) => prev.map((g) => (g === from ? clean : g)));
    setBookmarks((prev) =>
      prev.map((b) => (b.group === from ? { ...b, group: clean } : b)),
    );
  }

  return {
    bookmarks,
    groups,
    addGroup,
    addBookmark,
    removeBookmark,
    removeGroup,
    renameGroup,
  };
}
