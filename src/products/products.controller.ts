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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard) //Proteger todo el controlador
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('ADMIN') //Solo ADMIN puede crear productos
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Post('seed')
  @Roles('ADMIN') //Solo ADMIN
  @HttpCode(HttpStatus.OK)
  seed() {
    return this.productsService.seedDefaultProducts();
  }

  @Get()
  @Roles('ADMIN', 'CASHIER', 'KITCHEN') //Todos pueden ver productos
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.productsService.findAll(includeInactive === 'true');
  }

  @Get('active')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN') //Todos pueden ver activos
  findActive() {
    return this.productsService.findActive();
  }

  @Get('search')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN') //Todos pueden buscar
  search(@Query('q') query: string) {
    return this.productsService.search(query);
  }

  @Get('code/:code')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN') //Todos
  findByCode(@Param('code') code: string) {
    return this.productsService.findByCode(code);
  }

  @Get(':id')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN') //Todos
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN') //Solo ADMIN puede actualizar
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/toggle-active')
  @Roles('ADMIN') //Solo ADMIN
  @HttpCode(HttpStatus.OK)
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.toggleActive(id);
  }

  @Delete(':id')
  @Roles('ADMIN') //Solo ADMIN puede eliminar
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
