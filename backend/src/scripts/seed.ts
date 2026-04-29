import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';

import { SeedService } from './seed.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn', 'log'],
    });

    try {
        const seedService = app.get(SeedService);
        await seedService.run();
        Logger.log('Seed finished successfully');
    } finally {
        await app.close();
    }
}

void bootstrap().catch((err: unknown) => {
    Logger.error(err);
    process.exit(1);
});
