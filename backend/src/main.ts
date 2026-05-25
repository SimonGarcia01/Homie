import { join } from 'path';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);

    app.enableCors({
        origin: true,
        credentials: true,
    });

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    const uploadsDir = configService.get<string>('UPLOADS_DIR', join(process.cwd(), 'uploads'));
    const uploadsPrefix = configService.get<string>('UPLOADS_PUBLIC_PREFIX', '/uploads');
    app.useStaticAssets(uploadsDir, { prefix: uploadsPrefix });

    const config = new DocumentBuilder()
        .setTitle('Rental CRM API')
        .setDescription('Backend NestJS para CRM inmobiliario de arriendos')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}

void bootstrap();
