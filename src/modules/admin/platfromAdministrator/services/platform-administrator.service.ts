import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole, ProfileType, UserStatus } from 'prisma/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { SecurityUtil } from 'src/common/security/security.util';
import { CreateSupporterDto } from '../dto/create-supporter.dto';
import { CreateMakerDto } from '../dto/create-maker.dto';
import { CreateDeveloperDto } from '../dto/create-developer.dto';
import { FilterAdministratorDto } from '../dto/filter-administrator.dto';
import { UpdateRoleStatusDto } from '../dto/update-role-status.dto';
import { Prisma } from 'prisma/generated/prisma/client';

@Injectable()
export class PlatformAdministratorService {
  constructor(private readonly prisma: PrismaService) { }

  async createAdmin(dto: CreateAdminDto) {
    const email = dto.email.toLowerCase();
    await this.checkUserExists(email);

    const passwordHash = await SecurityUtil.hashData(dto.password || 'EduTech@2024', true);

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          authSecurity: {
            create: { hasPassword: true }
          }
        }
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          profileType: ProfileType.ADMIN,
        }
      });

      await tx.adminProfile.create({
        data: {
          profileId: profile.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          designation: dto.designation,
        }
      });

      return { userId: user.id, email: user.email };
    });
  }

  async createSupporter(dto: CreateSupporterDto) {
    const email = dto.email.toLowerCase();
    await this.checkUserExists(email);

    const passwordHash = await SecurityUtil.hashData(dto.password || 'EduTech@2024', true);

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: UserRole.SUPPORTER,
          status: UserStatus.ACTIVE,
          authSecurity: {
            create: { hasPassword: true }
          }
        }
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          profileType: ProfileType.SUPPORTER,
        }
      });

      await tx.supporterProfile.create({
        data: {
          profileId: profile.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
        }
      });

      return { userId: user.id, email: user.email };
    });
  }

  async createMaker(dto: CreateMakerDto) {
    const email = dto.email.toLowerCase();
    await this.checkUserExists(email);

    const passwordHash = await SecurityUtil.hashData(dto.password || 'EduTech@2024', true);

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: UserRole.QUIZZER,
          status: UserStatus.ACTIVE,
          authSecurity: {
            create: { hasPassword: true }
          }
        }
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          profileType: ProfileType.QUIZZER,
        }
      });

      await tx.makerProfile.create({
        data: {
          profileId: profile.id,
          displayName: dto.displayName,
          bio: dto.bio,
          expertise: dto.expertise || [],
        }
      });

      return { userId: user.id, email: user.email };
    });
  }

  async createDeveloper(dto: CreateDeveloperDto) {
    const email = dto.email.toLowerCase();
    await this.checkUserExists(email);

    const passwordHash = await SecurityUtil.hashData(dto.password || 'EduTech@2024', true);

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: UserRole.DEVELOPER,
          status: UserStatus.ACTIVE,
          authSecurity: {
            create: { hasPassword: true }
          }
        }
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          profileType: ProfileType.DEVELOPER,
        }
      });

      await tx.developerProfile.create({
        data: {
          profileId: profile.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          githubId: dto.githubId,
        }
      });

      return { userId: user.id, email: user.email };
    });
  }

  async findAllAdministrators(filter: FilterAdministratorDto) {
    const roles: UserRole[] = filter.role
      ? [filter.role as unknown as UserRole]
      : [UserRole.ADMIN, UserRole.SUPPORTER, UserRole.QUIZZER, UserRole.DEVELOPER];

    const where: Prisma.UserWhereInput = {
      role: { in: roles },
      deletedAt: null,
    };

    if (filter.search) {
      const search = filter.search;
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        {
          profile: {
            OR: [
              { admin: { firstName: { contains: search, mode: 'insensitive' } } },
              { admin: { lastName: { contains: search, mode: 'insensitive' } } },
              { supporter: { firstName: { contains: search, mode: 'insensitive' } } },
              { supporter: { lastName: { contains: search, mode: 'insensitive' } } },
              { maker: { displayName: { contains: search, mode: 'insensitive' } } },
              { developer: { firstName: { contains: search, mode: 'insensitive' } } },
              { developer: { lastName: { contains: search, mode: 'insensitive' } } },
            ]
          }
        }
      ];
    }

    return await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          include: {
            admin: true,
            supporter: true,
            maker: true,
            developer: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateAdministratorStatus(userId: string, dto: UpdateRoleStatusDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        role: { in: [UserRole.ADMIN, UserRole.SUPPORTER, UserRole.QUIZZER, UserRole.DEVELOPER] },
        deletedAt: null,
      }
    });

    if (!user) {
      throw new NotFoundException('Administrator not found');
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status },
      select: { id: true, email: true, status: true, role: true }
    });
  }

  private async checkUserExists(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      throw new ConflictException('User with this email already exists');
    }
  }
}
