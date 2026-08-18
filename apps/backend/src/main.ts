import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: (origin, callback) => {
      const allowed =
        process.env.CORS_ORIGINS?.split(',')
          .map((o) => o.trim().replace(/^"|"$/g, ''))
          .filter(Boolean) ?? [];
      if (
        !origin ||
        allowed.includes(origin) ||
        /^https:\/\/localhost:\d+$/.test(origin ?? '')
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const prismaService = app.get(PrismaService);
  app.useGlobalFilters(new GlobalExceptionFilter(prismaService));

  await app.listen(process.env.PORT ?? 4000);
  console.log(`Server is running on port ${process.env.PORT ?? 4000}`);
}
bootstrap();
