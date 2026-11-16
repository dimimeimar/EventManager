import 'dotenv/config';
import { readFileSync } from 'fs';
import { NestFactory } from '@nestjs/core';
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

  const app = await NestFactory.create(AppModule, { httpsOptions });

  app.use(helmet());

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
