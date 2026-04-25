import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../dto/subscription-plan.dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubscriptionPlanDto) {
    const existing = await this.prisma.subscriptionPlan.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
    });

    if (existing) {
      throw new ConflictException(`Subscription plan with name "${dto.name}" already exists`);
    }

    return this.prisma.subscriptionPlan.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        categoryPlans: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    return plan;
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.subscriptionPlan.findFirst({
        where: {
          name: { equals: dto.name, mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(`Subscription plan with name "${dto.name}" already exists`);
      }
    }

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const plan = await this.findOne(id);
    
    // Check if there are active subscriptions using this plan
    const activeSubsCount = await this.prisma.studentSubscription.count({
      where: { planId: id, status: 'ACTIVE' },
    });

    if (activeSubsCount > 0) {
      throw new ConflictException('Cannot delete plan with active subscriptions');
    }

    return this.prisma.subscriptionPlan.delete({
      where: { id },
    });
  }
}
