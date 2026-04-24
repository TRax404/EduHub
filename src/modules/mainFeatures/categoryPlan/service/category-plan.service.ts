import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateCategoryPlanDto } from '../dto/create-category-plan.dto';
import { UpdateCategoryPlanDto } from '../dto/update-category-plan.dto';

@Injectable()
export class CategoryPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryPlanDto: CreateCategoryPlanDto) {
    const { categoryId, planId, ...data } = createCategoryPlanDto;

    // 1. Check if Category and Plan exist
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Subscription Plan not found');

    // 2. Check if this specific plan is already linked to this category
    const existingLink = await this.prisma.categoryPlan.findUnique({
      where: {
        categoryId_planId: { categoryId, planId },
      },
    });
    if (existingLink) {
      throw new ConflictException('This plan is already linked to this category');
    }

    // 3. Check for case-insensitive plan name uniqueness within the same category
    const existingPlanWithName = await this.prisma.categoryPlan.findFirst({
      where: {
        categoryId,
        plan: {
          name: {
            equals: plan.name,
            mode: 'insensitive',
          },
        },
      },
    });

    if (existingPlanWithName) {
      throw new ConflictException(`A plan with the name "${plan.name}" is already linked to this category`);
    }

    return this.prisma.categoryPlan.create({
      data: {
        ...data,
        category: { connect: { id: categoryId } },
        plan: { connect: { id: planId } },
      },
      include: {
        category: true,
        plan: true,
      },
    });
  }

  async findAll() {
    return this.prisma.categoryPlan.findMany({
      include: {
        category: true,
        plan: true,
      },
    });
  }

  async findByCategoryId(categoryId: string) {
    return this.prisma.categoryPlan.findMany({
      where: { categoryId },
      include: {
        plan: true,
      },
    });
  }

  async findOne(id: string) {
    const categoryPlan = await this.prisma.categoryPlan.findUnique({
      where: { id },
      include: {
        category: true,
        plan: true,
      },
    });

    if (!categoryPlan) {
      throw new NotFoundException(`Category Plan with ID ${id} not found`);
    }

    return categoryPlan;
  }

  async update(id: string, updateCategoryPlanDto: UpdateCategoryPlanDto) {
    const { categoryId, planId, ...data } = updateCategoryPlanDto;

    // Verify existence
    const current = await this.findOne(id);

    // If categoryId or planId is changing, we need to re-validate uniqueness
    const finalCategoryId = categoryId || current.categoryId;
    const finalPlanId = planId || current.planId;

    if (categoryId || planId) {
      // Check if the combination already exists (if changed)
      if (finalCategoryId !== current.categoryId || finalPlanId !== current.planId) {
        const existingLink = await this.prisma.categoryPlan.findUnique({
          where: {
            categoryId_planId: { categoryId: finalCategoryId, planId: finalPlanId },
          },
        });
        if (existingLink) {
          throw new ConflictException('This plan combination is already linked');
        }
      }

      // Check name uniqueness if anything related to plan/category changed
      const targetPlan = await this.prisma.subscriptionPlan.findUnique({ where: { id: finalPlanId } });
      if (!targetPlan) throw new NotFoundException('Target Subscription Plan not found');

      const existingPlanWithName = await this.prisma.categoryPlan.findFirst({
        where: {
          id: { not: id },
          categoryId: finalCategoryId,
          plan: {
            name: {
              equals: targetPlan.name,
              mode: 'insensitive',
            },
          },
        },
      });

      if (existingPlanWithName) {
        throw new ConflictException(`A plan with the name "${targetPlan.name}" is already linked to this category`);
      }
    }

    return this.prisma.categoryPlan.update({
      where: { id },
      data: {
        ...data,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        plan: planId ? { connect: { id: planId } } : undefined,
      },
      include: {
        category: true,
        plan: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.categoryPlan.delete({
      where: { id },
    });
  }
}
