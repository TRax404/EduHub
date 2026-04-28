import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || 'my-cool-bucket';
  }

  async uploadFile(file: Express.Multer.File, folder = 'captures'): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          // ACL: 'public-read', // Uncomment if public access is needed
        }),
      );

      // Return the URL. Adjust based on your S3 config (CloudFront or direct)
      return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
    } catch (error) {
      throw new InternalServerErrorException(`S3 Upload failed: ${error.message}`);
    }
  }

  async listFiles() {
    return await this.s3.send(new ListObjectsCommand({ Bucket: this.bucketName }));
  }
}
