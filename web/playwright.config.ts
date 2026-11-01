import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    viewport: { width: 1440, height: 1050 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: '../scripts/mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=18080',
      url: 'http://127.0.0.1:18080/actuator/health',
      env: { DB_URL: 'jdbc:postgresql://localhost:5432/vehicle_inventory_test', CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:5174,http://localhost:5174' },
      timeout: 90_000,
      reuseExistingServer: false,
    },
    {
      command: 'bun run dev -- --host 127.0.0.1 --port 5174',
      url: 'http://127.0.0.1:5174',
      env: { VITE_API_BASE_URL: 'http://localhost:18080' },
      reuseExistingServer: false,
    },
  ],
})
