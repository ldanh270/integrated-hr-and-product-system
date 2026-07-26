import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { defineConfig, loadEnv } from "vite"
import type { Plugin, ResolvedConfig } from "vite"

interface CustomEmittedFile {
  fileName?: string
  [key: string]: unknown
}

interface CustomPluginContext {
  emitFile?: (emittedFile: CustomEmittedFile) => string
}

const normalizeDriveLetter = (p: string): string => {
  const resolved = path.resolve(p)
  if (/^[a-z]:/i.test(resolved)) {
    return resolved.charAt(0).toUpperCase() + resolved.slice(1)
  }
  return resolved
}

const projectRoot = normalizeDriveLetter(__dirname)

function fixWindowsPathPlugin(): Plugin {
  return {
    name: "fix-windows-path-plugin",
    enforce: "pre",
    configResolved(config: ResolvedConfig) {
      if (config.root) {
        ;(config as { root: string }).root = normalizeDriveLetter(config.root)
      }
    },
    buildStart() {
      const context = this as unknown as CustomPluginContext
      const originalEmitFile = context.emitFile
      if (typeof originalEmitFile === "function") {
        context.emitFile = function (emittedFile: CustomEmittedFile): string {
          if (emittedFile && typeof emittedFile.fileName === "string") {
            const fileName = emittedFile.fileName
            if (path.isAbsolute(fileName) || /^[a-zA-Z]:/.test(fileName)) {
              emittedFile.fileName = path.basename(fileName)
            }
          }
          return originalEmitFile.call(context, emittedFile)
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "")
  const apiTarget = env.VITE_API_BASE_URL || "http://localhost:5000"

  return {
    root: projectRoot,
    plugins: [fixWindowsPathPlugin(), tailwindcss(), react()],
    server: {
      open: true,
      proxy: {
        "/api": {
          target: apiTarget.replace(/\/api$/, ""),
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(projectRoot, "./src"),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(projectRoot, "index.html"),
        },
      },
    },
  }
})
