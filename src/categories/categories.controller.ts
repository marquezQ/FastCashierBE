import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll(
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
  ) {
    return this.categoriesService.findAll(includeInactive);
  }

  @Get('active')
  findActive() {
    return this.categoriesService.findActive();
  }

  @Get('inactive')
  findInactive() {
    return this.categoriesService.findInactive();
  }

  @Get('with-products')
  findAllWithProducts() {
    return this.categoriesService.findAllWithProducts();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.toggleActive(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.remove(id);
    return { message: 'Category deactivated successfully' };
  }
}