// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const githubRepository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const productionBase = githubRepository ? `/${githubRepository}/` : "/";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    router: {
      basepath: productionBase,
    },
    prerender: {
      enabled: true,
      crawlLinks: true,
    },
  },
  base: process.env.NODE_ENV === "production" ? productionBase : "/",
});
