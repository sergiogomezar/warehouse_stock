import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { type Env, validate } from './config/env.js';
import { basePostgresOptions } from './database/data-source-options.js';
import { entities } from './database/entities.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        ...basePostgresOptions(config.get('DATABASE_URL', { infer: true })),
        // The explicit list makes every relation target known, even when the
        // module owning it is not imported (for example in a partial test app).
        entities,
        autoLoadEntities: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
