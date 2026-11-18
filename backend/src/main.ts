import 'dotenv/config';
import { readFileSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // Όλη η επικοινωνία γίνεται πάνω από SSL/TLS.
  // Τα αρχεία δημιουργούνται με: npm run certs
  const httpsOptions = {
    key: readFileSync('./certs/key.pem'),
    cert: readFileSync('./certs/cert.pem'),
  };

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
  });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  // Οι φωτογραφίες των εκδηλώσεων σερβίρονται από το /uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // whitelist: πετάει όσα πεδία δεν υπάρχουν στο DTO
  // transform: μετατρέπει τα query/body στους τύπους του DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: ['https://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend: https://localhost:${port}`);
}
bootstrap();
