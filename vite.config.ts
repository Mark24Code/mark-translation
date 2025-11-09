import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isFirefox = mode === 'firefox'

  return {
    plugins: [
      react()
    ],
    build: {
      outDir: `dist/${mode}`,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: 'popup.html',
          options: 'options.html',
          background: 'src/background/index.ts',
          content: 'src/content/index.tsx'
        },
        output: {
          entryFileNames: '[name].js'
        }
      }
    }
  }
})