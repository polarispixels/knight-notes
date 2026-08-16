/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { studySummariesPlugin } from './build/studySummariesPlugin.ts'

export default defineConfig({
  plugins: [vue(), studySummariesPlugin()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
  },
})
