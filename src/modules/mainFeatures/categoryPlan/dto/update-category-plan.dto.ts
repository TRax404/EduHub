import { PartialType } from '@nestjs/swagger';
import { CreateCategoryPlanDto } from './create-category-plan.dto';

export class UpdateCategoryPlanDto extends PartialType(CreateCategoryPlanDto) {}
