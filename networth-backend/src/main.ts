import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(compression());

  // Global Request Logger for diagnostics
  app.use((req: any, res: any, next: any) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    console.log(`[Headers]`, {
      host: req.headers.host,
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      'user-agent': req.headers['user-agent']
    });
    next();
  });

  // Enable CORS - Allow all origins in development for mobile access
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Net Worth Tracking API')
    .setDescription('Personal finance and net worth tracking application API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  // Bind to 0.0.0.0 to allow network access from mobile devices
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📱 Network access: http://192.168.70.179:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
