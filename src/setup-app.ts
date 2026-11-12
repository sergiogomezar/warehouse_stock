import {
  type INestApplication,
  StandardSchemaValidationPipe,
} from '@nestjs/common';

/**
 * Applies app-wide setup shared by `main.ts` and the e2e tests,
 * so both run the same global pipes.
 */
export function setupApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  return app;
}
