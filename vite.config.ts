// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // Split heavy vendor libs into their own chunks so the initial
          // page bundle stays small and Three.js only loads on /iss.
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("/three/") || id.includes("@react-three/")) return "three";
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("recharts") || id.includes("d3-")) return "charts";
            if (id.includes("@radix-ui/")) return "radix";
            if (id.includes("lucide-react")) return "icons";
          },
        },
      },
    },
  },
});
