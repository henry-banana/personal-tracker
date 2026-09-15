import { createId } from "../../lib/id";
import { normalizeUrl, titleFromUrl } from "../../lib/url";
import { useSnapshot, useTracker } from "../tracker/provider";
import type { Resource } from "../tracker/types";
export type Bookmark = Resource;
export type BookmarkDraft = { url: string; title: string; group: string };
export function useBookmarks() {
  const snapshot = useSnapshot(),
    store = useTracker();
  return {
    bookmarks: snapshot.resources,
    groups: snapshot.groups,
    addGroup: (name: string) =>
      store.commit((s) => {
        const clean = name.trim();
        if (clean && !s.groups.includes(clean)) s.groups.push(clean);
      }),
    addBookmark: (draft: BookmarkDraft) =>
      store.commit((s) => {
        const url = normalizeUrl(draft.url);
        if (!url) throw Error("invalid-url");
        const group = draft.group.trim();
        if (group && !s.groups.includes(group)) s.groups.push(group);
        s.resources.unshift({
          id: createId(),
          url,
          title: draft.title.trim() || titleFromUrl(url),
          group,
          createdAt: Date.now(),
        });
      }),
    removeBookmark: (id: string) =>
      store.commit((s) => {
        s.resources = s.resources.filter((r) => r.id !== id);
      }),
    removeGroup: (name: string) =>
      store.commit((s) => {
        s.groups = s.groups.filter((g) => g !== name);
        s.resources.forEach((r) => {
          if (r.group === name) r.group = "";
        });
      }),
    renameGroup: (from: string, to: string) =>
      store.commit((s) => {
        const clean = to.trim();
        if (!clean || clean === from || s.groups.includes(clean)) return;
        s.groups = s.groups.map((g) => (g === from ? clean : g));
        s.resources.forEach((r) => {
          if (r.group === from) r.group = clean;
        });
      }),
  };
}
