import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateStudentProfileDto } from '../dto/update-student-profile.dto';
import { SecurityUtil } from '../../../common/security/security.util';

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
        const referralCode = SecurityUtil.generateSecureToken(4).toUpperCase();
        return await tx.studentProfile.create({
          data: {
            profileId: profile.id,
            firstName: dto.firstName || '',
            lastName: dto.lastName,
            avatarUrl: dto.avatarUrl,
            institutionName: dto.institutionName,
            bio: dto.bio,
            classLevel: dto.classLevel,
            studentGroup: dto.studentGroup,
            targetExam: dto.targetExam,
            referralCode,
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
}
