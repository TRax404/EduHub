import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecurityUtil } from 'src/common/security/security.util';
import { UserRole, UserStatus, ProfileType } from '../../../prisma/generated/prisma/enums';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(private readonly prisma: PrismaService) { }

  async seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'superadmin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '123456789';

    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      this.logger.log('Super Admin already exists, skipping seeding.');
      return existingAdmin;
    }

    const hashedPassword = await SecurityUtil.hashData(adminPassword, true);

    const admin = await this.prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.SUPERADMIN,
        status: UserStatus.ACTIVE,
        profile: {
          create: {
            profileType: ProfileType.ADMIN,
            admin: {
              create: {
                firstName: 'Super',
                lastName: 'Admin',
                designation: 'System Administrator',
              },
            },
          },
        },
      },
      include: {
        profile: {
          include: {
            admin: true,
          },
        },
      },
    });

    this.logger.log(`Super Admin user created: ${adminEmail}`);
    return admin;
  }
}
