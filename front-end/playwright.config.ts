import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/browser', testMatch: '*.spec.ts', workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5179',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
  },
  webServer: [
    { command: 'node test/browser/backend.mjs', url: 'http://127.0.0.1:55440/api/ready', reuseExistingServer: false },
    { command: 'npm run dev -- --host 127.0.0.1 --port 5179 --strictPort', url: 'http://127.0.0.1:5179',
      env: { AUTH_TEST_BACKEND_ORIGIN: 'http://127.0.0.1:55440', VITE_API_BASE_URL: '' }, reuseExistingServer: false },
  ],
})
