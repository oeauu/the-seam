export interface RouteState {
  kind: "globe" | "country" | "record";
  slug?: string;
  countryId?: string;
}

export function getBasePath(): string {
  const raw = import.meta.env.BASE_URL || "/";
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

export function withBasePath(path: string): string {
  const base = getBasePath();
  const clean = path.replace(/^\/+/, "");
  return `${base}${clean}`;
}

export function stripBasePath(pathname: string): string {
  const base = getBasePath();
  const prefix = base === "/" ? "" : base.slice(0, -1);
  if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return pathname.slice(prefix.length) || "/";
  }
  return pathname || "/";
}

export function isModalPath(pathname: string): boolean {
  const norm = stripBasePath(pathname).trim().replace(/\/+$/, "") || "/";
  return norm === "/archive" || norm === "/submit" || norm === "/about";
}

export function parseRoute(pathname: string = window.location.pathname, search = window.location.search): RouteState {
  const norm = stripBasePath(pathname).trim().replace(/\/+$/, "") || "/";
  if (norm.startsWith("/record/")) {
    try {
      const slug = decodeURIComponent(norm.slice("/record/".length));
      const countryId = new URLSearchParams(search).get("country") || undefined;
      return countryId ? { kind: "record", slug, countryId } : { kind: "record", slug };
    } catch { return { kind: "globe" }; }
  }
  if (norm.startsWith("/country/")) {
    try {
      const countryId = decodeURIComponent(norm.slice("/country/".length));
      return { kind: "country", countryId };
    } catch { return { kind: "globe" }; }
  }
  return { kind: "globe" };
}

export function buildRoutePath(route: RouteState): string {
  if (route.kind === "record" && route.slug) {
    const context = route.countryId ? `?country=${encodeURIComponent(route.countryId)}` : "";
    return withBasePath(`/record/${encodeURIComponent(route.slug)}${context}`);
  }
  if (route.kind === "country" && route.countryId) {
    return withBasePath(`/country/${encodeURIComponent(route.countryId)}`);
  }
  return getBasePath();
}

export function pushRoute(route: RouteState): void {
  const next = buildRoutePath(route);
  if (window.location.pathname + window.location.search !== next) {
    window.history.pushState({}, "", next);
  }
}
