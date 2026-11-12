import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Rebuilds the test database schema from the migrations once per run.
    globalSetup: ['./test/support/global-setup.ts'],
    // All e2e files share one database, so they must not run in parallel.
    fileParallelism: false,
  },
});
