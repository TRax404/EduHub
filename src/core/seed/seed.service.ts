import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  // async seedAdmin() {
  //     const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  //     const adminPassword = process.env.ADMIN_PASSWORD || 'Admin';

  //     const existingAdmin = await this.prisma.user.findUnique({
  //         where: { email: adminEmail },
  //     });

  //     if (existingAdmin) {
  //         this.logger.log('Admin already exists, skipping seeding.');
  //         console.log('admin already exits')
  //         return existingAdmin;
  //     }

  //     const hashedPassword = await SecurityUtil.hashData(adminPassword);

  //     const admin = await this.prisma.user.create({
  //         data: {
  //             email: adminEmail,
  //             name: 'Admin',
  //             password: hashedPassword,
  //             role: UserRole.ADMIN,
  //             status: UserStatus.ACTIVE,
  //         },
  //     });

  //     this.logger.log(`Admin user created: ${adminEmail}`);
  //     console.log("admin", admin.name, "created")
  //     return admin;
  // }
}
