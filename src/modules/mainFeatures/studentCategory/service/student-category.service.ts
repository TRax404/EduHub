import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class StudentCategoryService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createCategoryDto: CreateCategoryDto) {
    const { parentId, name, ...data } = createCategoryDto;

    // Auto-generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');

    const existingCategory = await this.prisma.category.findFirst({
      where: {
        parentId: parentId || null,
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug: slug }
        ]
      },
    });

    if (existingCategory) {
      const message = existingCategory.name.toLowerCase() === name.toLowerCase()
        ? 'Category name already exists'
        : 'Generated slug already exists';
      throw new ConflictException(message);
    }

    return this.prisma.category.create({
      data: {
        ...data,
        name,
        slug,
        parentId: parentId || null,
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
    const { parentId, name, ...data } = updateCategoryDto;

    const current = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('Category not found');
    }

    const targetName = name ?? current.name;
    const targetParentId = parentId !== undefined ? (parentId || null) : current.parentId;

    const targetSlug = name
      ? name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-')
      : current.slug;

    const existingCategory = await this.prisma.category.findFirst({
      where: {
        id: { not: id },
        parentId: targetParentId,
        OR: [
          { name: { equals: targetName, mode: 'insensitive' } },
          { slug: targetSlug }
        ]
      },
    });

    if (existingCategory) {
      const message = existingCategory.name.toLowerCase() === targetName.toLowerCase()
        ? 'Category name already exists'
        : 'Generated slug already exists';
      throw new ConflictException(message);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...data,
        name: targetName,
        slug: targetSlug,
        parentId: targetParentId,
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
