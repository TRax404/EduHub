import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class StudentCategoryService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createCategoryDto: CreateCategoryDto) {
    const { parentId, slug, ...data } = createCategoryDto;

    // Check if category with same name exists under same parent (case-insensitive)
    const existingName = await this.prisma.category.findFirst({
      where: {
        parentId: parentId || null,
        name: {
          equals: data.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingName) {
      throw new ConflictException('Category with this name already exists under this parent');
    }

    // Check if category with same slug exists under same parent
    const existingSlug = await this.prisma.category.findUnique({
      where: {
        parentId_slug: {
          parentId: parentId as any,
          slug,
        },
      },
    });

    if (existingSlug) {
      throw new ConflictException('Category with this slug already exists under this parent');
    }

    return this.prisma.category.create({
      data: {
        ...data,
        slug,
        parent: parentId ? { connect: { id: parentId } } : undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const { parentId, ...data } = updateCategoryDto;

    // Verify existence and get current state
    const current = await this.findOne(id);

    const targetParentId = parentId !== undefined ? (parentId || null) : current.parentId;
    const targetName = data.name !== undefined ? data.name : current.name;
    const targetSlug = data.slug !== undefined ? data.slug : current.slug;

    // Check name uniqueness if name or parentId changed
    if (data.name !== undefined || parentId !== undefined) {
      const existingName = await this.prisma.category.findFirst({
        where: {
          id: { not: id },
          parentId: targetParentId,
          name: {
            equals: targetName,
            mode: 'insensitive',
          },
        },
      });
      if (existingName) {
        throw new ConflictException('Category with this name already exists under this parent');
      }
    }

    // Check slug uniqueness if slug or parentId changed
    if (data.slug !== undefined || parentId !== undefined) {
      const existingSlug = await this.prisma.category.findFirst({
        where: {
          id: { not: id },
          parentId: targetParentId,
          slug: targetSlug,
        },
      });
      if (existingSlug) {
        throw new ConflictException('Category with this slug already exists under this parent');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...data,
        parent: parentId !== undefined ? (parentId ? { connect: { id: parentId } } : { disconnect: true }) : undefined,
      },
    });
  }

  async remove(id: string) {
    // Verify existence
    await this.findOne(id);

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async getTree() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }
}
