import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

const PORT = Number(process.env.PORT) || 3001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  // read allowed origins from env (comma-separated) or default to localhost:3000
  const allowedOrigins = (process.env.ORIGIN || 'http://localhost:3000').split(',');

  app.enableCors({
    // when credentials are used, origin must be explicit
    origin: (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // allow requests with no origin (e.g., curl, mobile apps)
      if (!requestOrigin) return callback(null, true);
      if (allowedOrigins.includes(requestOrigin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  await app.listen(PORT);
  console.log('server listening on port', PORT, 'for', allowedOrigins);
}
bootstrap();
