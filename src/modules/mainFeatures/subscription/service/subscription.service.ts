import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateStudentSubscriptionDto, AdminGrantDto } from '../dto/student-subscription.dto';
import { SubscriptionStatus } from 'prisma/generated/prisma/enums';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(studentId: string, dto: CreateStudentSubscriptionDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.studentSubscription.create({
        data: {
          studentId,
          planId: dto.planId,
          endDate,
          academicYear: dto.academicYear,
          status: SubscriptionStatus.ACTIVE, // Assuming immediate activation for now
          categories: {
            create: dto.categoryIds.map((categoryId) => ({
              categoryId,
              status: SubscriptionStatus.ACTIVE,
            })),
          },
        },
        include: {
          categories: true,
          plan: true,
        },
      });

      return subscription;
    });
  }

  async grantAccess(adminId: string, dto: AdminGrantDto) {
    return this.prisma.adminGrant.create({
      data: {
        studentId: dto.studentId,
        categoryId: dto.categoryId,
        featureId: dto.featureId,
        planTier: dto.planTier,
        reason: dto.reason,
        grantedBy: adminId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async getStudentSubscriptions(studentId: string) {
    return this.prisma.studentSubscription.findMany({
      where: { studentId },
      include: {
        plan: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async cancelSubscription(id: string) {
    return this.prisma.studentSubscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELLED },
    });
  }
}
