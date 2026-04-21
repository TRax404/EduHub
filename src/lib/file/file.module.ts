import { Global, Module } from '@nestjs/common';
import { S3Service } from './service/s3.service';
import { MulterService } from './service/multer.service';

@Global()
@Module({
  providers: [S3Service, MulterService],
  exports: [S3Service, MulterService],
})
export class FileModule {}
