export interface RouteState {
  kind: "globe" | "country" | "record";
  slug?: string;
  countryId?: string;
}

export function parseRoute(pathname: string = window.location.pathname): RouteState {
  const norm = pathname.trim().replace(/\/+$/, "") || "/";
  if (norm.startsWith("/record/")) {
    const slug = decodeURIComponent(norm.slice("/record/".length));
    return { kind: "record", slug };
  }
  if (norm.startsWith("/country/")) {
    const countryId = decodeURIComponent(norm.slice("/country/".length));
    return { kind: "country", countryId };
  }
  return { kind: "globe" };
}

export function buildRoutePath(route: RouteState): string {
  if (route.kind === "record" && route.slug) {
    return `/record/${encodeURIComponent(route.slug)}`;
  }
  if (route.kind === "country" && route.countryId) {
    return `/country/${encodeURIComponent(route.countryId)}`;
  }
  return "/";
}

export function pushRoute(route: RouteState): void {
  const next = buildRoutePath(route);
  if (window.location.pathname !== next) {
    window.history.pushState({}, "", next);
  }
}
