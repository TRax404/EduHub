import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeederService } from './seed.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeederService);

  await seeder.seedAdmin();

  await app.close();
}

run()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seeding failed', err);
    process.exit(1);
  });
