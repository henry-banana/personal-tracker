import { useEffect, useState, type AnchorHTMLAttributes } from "react";
import { isRoute, type Route } from "./routes";

const base = import.meta.env.BASE_URL;
const navigationEvent = "pt:navigate";

export function routeUrl(route: Route): string {
  return route === "calendar" ? base : `${base}${route}/`;
}

function legacyRoute(): Route | null {
  const name = window.location.hash.replace(/^#\/?/, "");
  return isRoute(name) ? name : null;
}

function readRoute(): Route | null {
  const path = window.location.pathname;
  if (path !== base.slice(0, -1) && !path.startsWith(base)) return null;
  const legacy = legacyRoute();
  if (legacy) return legacy;
  const name = path.slice(base.length).replace(/\/$/, "");
  if (!name || name === "index.html") return "calendar";
  return isRoute(name) ? name : null;
}

export function navigate(route: Route) {
  const url = routeUrl(route);
  if (
    window.location.pathname + window.location.search + window.location.hash !==
    url
  ) {
    window.history.pushState(null, "", url);
  }
  window.dispatchEvent(new Event(navigationEvent));
}

export function useRoute() {
  const [route, setRoute] = useState<Route | null>(readRoute);
  useEffect(() => {
    const update = () => {
      const next = readRoute();
      if (next) {
        // Old shared hash URLs remain usable; Calendar has one canonical root URL.
        const url =
          routeUrl(next) +
          window.location.search +
          (legacyRoute() ? "" : window.location.hash);
        if (
          url !==
          window.location.pathname +
            window.location.search +
            window.location.hash
        ) {
          window.history.replaceState(null, "", url);
        }
      }
      setRoute(next);
    };
    update();
    window.addEventListener("popstate", update);
    window.addEventListener("hashchange", update);
    window.addEventListener(navigationEvent, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("hashchange", update);
      window.removeEventListener(navigationEvent, update);
    };
  }, []);
  return route;
}

export function RouteLink({
  to,
  onClick,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: Route }) {
  return (
    <a
      {...props}
      href={routeUrl(to)}
      onClick={(event) => {
        onClick?.(event);
        // Preserve native open-in-new-tab, downloads, and modified clicks.
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey ||
          props.download ||
          (props.target && props.target !== "_self")
        )
          return;
        event.preventDefault();
        navigate(to);
      }}
    />
  );
}
