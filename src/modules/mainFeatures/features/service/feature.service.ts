import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateFeatureDto } from '../dto/create-feature.dto';
import { UpdateFeatureDto } from '../dto/update-feature.dto';

@Injectable()
export class FeatureService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createFeatureDto: CreateFeatureDto) {
    const { name, label, ...data } = createFeatureDto;

    // 1. Check if feature name exists (case-insensitive)
    const existingName = await this.prisma.feature.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
    if (existingName) {
      throw new ConflictException(`Feature with name ${name} already exists`);
    }

    // 2. Check if feature label exists (case-insensitive)
    const existingLabel = await this.prisma.feature.findFirst({
      where: {
        label: {
          equals: label,
          mode: 'insensitive',
        },
      },
    });
    if (existingLabel) {
      throw new ConflictException(`Feature with label ${label} already exists`);
    }

    return this.prisma.feature.create({
      data: {
        ...data,
        name,
        label,
      },
    });
  }

  async findAll() {
    return this.prisma.feature.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const feature = await this.prisma.feature.findUnique({
      where: { id },
      include: {
        planConfigs: {
          include: {
            plan: true,
          },
        },
        categoryOverrides: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }

    return feature;
  }

  async update(id: string, updateFeatureDto: UpdateFeatureDto) {
    const { name, label, ...data } = updateFeatureDto;

    // Verify existence
    const current = await this.findOne(id);

    // Check name uniqueness if changed
    if (name && name.toLowerCase() !== current.name.toLowerCase()) {
      const existingName = await this.prisma.feature.findFirst({
        where: {
          id: { not: id },
          name: { equals: name, mode: 'insensitive' },
        },
      });
      if (existingName) {
        throw new ConflictException(`Feature with name ${name} already exists`);
      }
    }

    // Check label uniqueness if changed
    if (label && label.toLowerCase() !== current.label.toLowerCase()) {
      const existingLabel = await this.prisma.feature.findFirst({
        where: {
          id: { not: id },
          label: { equals: label, mode: 'insensitive' },
        },
      });
      if (existingLabel) {
        throw new ConflictException(`Feature with label ${label} already exists`);
      }
    }

    return this.prisma.feature.update({
      where: { id },
      data: {
        ...data,
        name,
        label,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.feature.delete({
      where: { id },
    });
  }
}
