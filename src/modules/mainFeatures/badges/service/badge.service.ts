import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateBadgeDto, UpdateBadgeDto, BadgeRuleDto } from '../dto/badge.dto';
import { BadgeEventType } from 'prisma/generated/prisma/enums';

@Injectable()
export class BadgeService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createBadgeDto: CreateBadgeDto) {
    const { rules, ...badgeData } = createBadgeDto;

    const existing = await this.prisma.badge.findFirst({
      where: { name: { equals: badgeData.name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException(`Badge with name ${badgeData.name} already exists`);
    }

    return this.prisma.badge.create({
      data: {
        ...badgeData,
        rules: {
          create: rules?.map(rule => ({
            eventType: rule.eventType,
            condition: rule.condition,
            isActive: rule.isActive ?? true,
          })),
        },
      },
      include: {
        rules: true,
      },
    });
  }

  async findAll() {
    return this.prisma.badge.findMany({
      include: { rules: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { id },
      include: { rules: true },
    });

    if (!badge) {
      throw new NotFoundException(`Badge with ID ${id} not found`);
    }

    return badge;
  }

  async update(id: string, updateBadgeDto: UpdateBadgeDto) {
    await this.findOne(id);

    if (updateBadgeDto.name) {
      const existing = await this.prisma.badge.findFirst({
        where: {
          id: { not: id },
          name: { equals: updateBadgeDto.name, mode: 'insensitive' },
        },
      });
      if (existing) {
        throw new ConflictException(`Badge with name ${updateBadgeDto.name} already exists`);
      }
    }

    return this.prisma.badge.update({
      where: { id },
      data: updateBadgeDto,
      include: { rules: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.badge.delete({
      where: { id },
    });
  }

  async addRule(badgeId: string, ruleDto: BadgeRuleDto) {
    await this.findOne(badgeId);
    return this.prisma.badgeRule.create({
      data: {
        ...ruleDto,
        badgeId,
      },
    });
  }

  async updateRule(ruleId: string, ruleDto: Partial<BadgeRuleDto>) {
    const rule = await this.prisma.badgeRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException('Rule not found');

    return this.prisma.badgeRule.update({
      where: { id: ruleId },
      data: ruleDto,
    });
  }

  async removeRule(ruleId: string) {
    const rule = await this.prisma.badgeRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException('Rule not found');

    return this.prisma.badgeRule.delete({ where: { id: ruleId } });
  }

  async checkAndAwardBadges(studentId: string, eventType: BadgeEventType, context: any) {
    const activeRules = await this.prisma.badgeRule.findMany({
      where: {
        eventType,
        isActive: true,
        badge: { isActive: true },
      },
      include: { badge: true },
    });

    const awardedBadges = [];

    for (const rule of activeRules) {
      const alreadyHas = await this.prisma.userBadge.findUnique({
        where: {
          studentProfileId_badgeId: {
            studentProfileId: studentId,
            badgeId: rule.badgeId,
          },
        },
      });

      if (alreadyHas) continue;

      const isMet = this.evaluateCondition(rule.condition, context);

      if (isMet) {
        const userBadge = await this.awardBadge(studentId, rule.badgeId, eventType, context);
        awardedBadges.push(userBadge);
      }
    }

    return awardedBadges;
  }

  private evaluateCondition(condition: any, context: any): boolean {
    if (condition.minScore && context.score < condition.minScore) return false;
    if (condition.minReferrals && context.totalReferrals < condition.minReferrals) return false;
    return true;
  }

  private async awardBadge(studentId: string, badgeId: string, eventType: BadgeEventType, context: any) {
    return await this.prisma.$transaction(async (tx) => {
      const badge = await tx.badge.findUnique({ where: { id: badgeId } });
      if (!badge) throw new Error('Badge not found');

      const userBadge = await tx.userBadge.create({
        data: {
          studentProfileId: studentId,
          badgeId,
          eventType,
          diamondAwarded: badge.diamondReward,
          meta: context,
        },
        include: { badge: true },
      });

      if (badge.diamondReward > 0) {
        await tx.diamondWallet.upsert({
          where: { studentProfileId: studentId },
          update: { balance: { increment: badge.diamondReward } },
          create: {
            studentProfileId: studentId,
            balance: badge.diamondReward,
          },
        });
      }

      return userBadge;
    });
  }
}
