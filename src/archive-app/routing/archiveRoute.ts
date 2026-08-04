export type ArchiveRoute =
  | { kind: "home" }
  | { kind: "archive" }
  | { kind: "submit" }
  | { kind: "about" }
  | { kind: "record"; slug: string };

function normalizePath(pathname: string): string {
  const path = pathname.trim().replace(/\/+$/, "");
  return path || "/";
}

export function parseArchiveRoute(pathname: string = window.location.pathname): ArchiveRoute {
  const path = normalizePath(pathname);
  if (path === "/" || path === "/index.html") return { kind: "home" };
  if (path === "/archive") return { kind: "archive" };
  if (path === "/submit") return { kind: "submit" };
  if (path === "/about") return { kind: "about" };
  if (path.startsWith("/record/")) {
    const slug = decodeURIComponent(path.slice("/record/".length));
    return slug ? { kind: "record", slug } : { kind: "home" };
  }
  return { kind: "home" };
}

export function writeArchiveRoute(route: ArchiveRoute): string {
  if (route.kind === "home") return "/";
  if (route.kind === "archive") return "/archive";
  if (route.kind === "submit") return "/submit";
  if (route.kind === "about") return "/about";
  return `/record/${encodeURIComponent(route.slug)}`;
}

export function navigateArchiveRoute(route: ArchiveRoute): void {
  const nextPath = writeArchiveRoute(route);
  if (window.location.pathname !== nextPath) {
    window.history.pushState({}, "", nextPath);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}
