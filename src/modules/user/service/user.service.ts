import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateStudentProfileDto } from '../dto/update-student-profile.dto';
import { SecurityUtil } from '../../../common/security/security.util';
import { Prisma } from 'prisma/generated/prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        profile: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateStudentProfile(userId: string, dto: UpdateStudentProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { student: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Ensure Profile exists
      let profile = user.profile;
      if (!profile) {
        profile = await tx.profile.create({
          data: {
            userId: user.id,
            profileType: 'STUDENT',
          },
          include: { student: true },
        });
      }

      // 2. Ensure StudentProfile exists and update it
      if (!profile.student) {
        const baseName = (dto.firstName || 'user').toLowerCase().replace(/\s+/g, '');
        const profileName = await this.generateUniqueProfileName(tx, baseName);
        const referralCode = await this.generateUniqueReferralCode(tx, baseName);

        return await tx.studentProfile.create({
          data: {
            profileId: profile.id,
            firstName: dto.firstName || '',
            lastName: dto.lastName,
            profileName,
            referralCode,
            avatarUrl: dto.avatarUrl,
            institutionName: dto.institutionName,
            bio: dto.bio,
            classLevel: dto.classLevel,
            studentGroup: dto.studentGroup,
            targetExam: dto.targetExam,
          },
        });
      } else {
        return await tx.studentProfile.update({
          where: { id: profile.student.id },
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            avatarUrl: dto.avatarUrl,
            institutionName: dto.institutionName,
            bio: dto.bio,
            classLevel: dto.classLevel,
            studentGroup: dto.studentGroup,
            targetExam: dto.targetExam,
          },
        });
      }
    });
  }

  private async generateUniqueProfileName(tx: Prisma.TransactionClient, baseName: string): Promise<string> {
    let profileName = baseName;
    let counter = 1;

    while (true) {
      const existing = await tx.studentProfile.findUnique({
        where: { profileName },
      });

      if (!existing) {
        return profileName;
      }

      profileName = `${baseName}${counter}`;
      counter++;
    }
  }

  private async generateUniqueReferralCode(tx: Prisma.TransactionClient, userName: string): Promise<string> {
    const prefix = 'medhavQ';
    let counter = Math.floor(100 + Math.random() * 900); // Start with a random 3-digit number

    while (true) {
      const referralCode = `${prefix}${userName}${counter}`;
      const existing = await tx.studentProfile.findUnique({
        where: { referralCode },
      });

      if (!existing) {
        return referralCode;
      }

      counter++;
    }
  }
}
