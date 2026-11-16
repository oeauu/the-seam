import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'
import react from '@vitejs/plugin-react'

function normalizeBasePath(raw?: string): string {
  const cleaned = (raw || '').trim().replace(/^\/+|\/+$/g, '')
  return cleaned ? `/${cleaned}/` : '/'
}

function githubPagesSpaFallback(): Plugin {
  let resolved: ResolvedConfig | null = null
  return {
    name: 'seam-github-pages-spa-fallback',
    configResolved(config) {
      resolved = config
    },
    generateBundle() {
      const base = normalizeBasePath(resolved?.base)
      const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>The Seam</title>
    <script>
      (function () {
        var base = ${JSON.stringify(base)};
        var path = window.location.pathname || "/";
        var route = path.indexOf(base) === 0 ? path.slice(base.length - 1) : path;
        var target = base + "?__seam_redirect=" + encodeURIComponent(route + window.location.search + window.location.hash);
        window.location.replace(target);
      })();
    </script>
  </head>
  <body></body>
</html>
`
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: html,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: normalizeBasePath(process.env.VITE_BASE_PATH),
  plugins: [react(), githubPagesSpaFallback()],
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  build: {
    chunkSizeWarningLimit: 750,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
            {
              name: 'maplibre-vendor',
              test: /node_modules[\\/]maplibre-gl[\\/]/,
            },
            {
              name: 'd3-vendor',
              test: /node_modules[\\/](d3|d3-.*|topojson-client)[\\/]/,
            },
          ],
        },
      },
    },
  },
})
