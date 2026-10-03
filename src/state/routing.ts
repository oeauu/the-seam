export interface RouteState {
  kind: "globe" | "country" | "record";
  slug?: string;
  countryId?: string;
}

export function parseRoute(pathname: string = window.location.pathname, search = window.location.search): RouteState {
  const norm = pathname.trim().replace(/\/+$/, "") || "/";
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
    return `/record/${encodeURIComponent(route.slug)}${context}`;
  }
  if (route.kind === "country" && route.countryId) {
    return `/country/${encodeURIComponent(route.countryId)}`;
  }
  return "/";
}

export function pushRoute(route: RouteState): void {
  const next = buildRoutePath(route);
  if (window.location.pathname + window.location.search !== next) {
    window.history.pushState({}, "", next);
  }
}
