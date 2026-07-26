import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import fs from "node:fs"
import { defineConfig, loadEnv } from "vite"

// Resolve real path to handle Windows drive letter aliases (e.g. E: vs G:)
const getRealPath = (p: string) => {
  try {
    return fs.realpathSync(p)
  } catch {
    return p
  }
}

const projectRoot = getRealPath(path.resolve(__dirname))

function fixWindowsPathPlugin() {
  return {
    name: "fix-windows-path-plugin",
    enforce: "pre" as const,
    configResolved(config: any) {
      if (config.root) {
        config.root = getRealPath(config.root)
      }
    },
    buildStart(this: any) {
      // Ensure plugin context emitFile cleans absolute path fileNames if any
      const originalEmitFile = this.emitFile
      if (originalEmitFile) {
        this.emitFile = function (emittedFile: any) {
          if (emittedFile && typeof emittedFile.fileName === "string") {
            const fileName = emittedFile.fileName
            if (path.isAbsolute(fileName) || /^[a-zA-Z]:/.test(fileName)) {
              emittedFile.fileName = path.basename(fileName)
            }
          }
          return originalEmitFile.call(this, emittedFile)
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
