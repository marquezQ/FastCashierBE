import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productsService.create(createProductDto, file);
  }

  @Post('seed')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  seed() {
    return this.productsService.seedDefaultProducts();
  }

  @Get()
  @Roles('ADMIN', 'CASHIER', 'KITCHEN')
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.productsService.findAll(includeInactive === 'true');
  }

  @Get('active')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN')
  findActive() {
    return this.productsService.findActive();
  }

  @Get('inactive')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN')
  findInactive() {
    return this.productsService.findInactive();
  }

  // ============ NUEVOS ENDPOINTS ============

  // ENDPOINT 1: Para tu dashboard con tabs (Método 2)
  @Get('grouped-by-category')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN')
  findGroupedByCategory() {
    return this.productsService.findGroupedByCategory();
  }

  @Get('grouped-by-category/active')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN')
  findActiveGroupedByCategory() {
    return this.productsService.findActiveGroupedByCategory();
  }

  // ENDPOINT 2: Productos con información de categoría (Método 1)
  @Get('with-category')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN')
  findAllWithCategory() {
    return this.productsService.findAllWithCategory();
  }

  // ENDPOINT 3: Filtrar productos por categoría
  @Get('by-category/:categoryId')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN')
  findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.productsService.findByCategory(categoryId);
  }

  // ==========================================

  @Get('search')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN')
  search(@Query('q') query: string) {
    return this.productsService.search(query);
  }

  @Get('code/:code')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN')
  findByCode(@Param('code') code: string) {
    return this.productsService.findByCode(code);
  }

  @Get(':id')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productsService.update(id, updateProductDto, file);
  }

  @Patch(':id/toggle-active')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.toggleActive(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.remove(id);
    return { message: 'Product deactivated successfully' };
  }
}
