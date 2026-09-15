// Shared by the client router and the build: adding a page creates its static entry too.
export const routes = [
  "calendar",
  "tasks",
  "habits",
  "resources",
  "settings",
] as const;
export type Route = (typeof routes)[number];
export function isRoute(value: string): value is Route {
  return routes.some((route) => route === value);
}
