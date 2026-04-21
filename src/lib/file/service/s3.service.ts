import { Injectable } from '@nestjs/common';
import { ListObjectsCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.s3 = new S3Client({ region: 'us-east-1' });
    this.bucketName = 'my-cool-bucket';
  }
  async listFiles() {
    return await this.s3.send(new ListObjectsCommand({ Bucket: this.bucketName }));
  }
}