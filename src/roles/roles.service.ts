import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // Verificar si el nombre del rol ya existe
    const roleExists = await this.roleRepository.findOne({
      where: { roleName: createRoleDto.roleName },
    });

    if (roleExists) {
      throw new ConflictException('Role name already exists');
    }

    const role = this.roleRepository.create(createRoleDto);
    return await this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { idRole: id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async findByName(roleName: string): Promise<Role | null> {
    return await this.roleRepository.findOne({
      where: { roleName },
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    // Si se intenta actualizar el nombre, verificar que no exista
    if (updateRoleDto.roleName && updateRoleDto.roleName !== role.roleName) {
      const roleExists = await this.roleRepository.findOne({
        where: { roleName: updateRoleDto.roleName },
      });

      if (roleExists) {
        throw new ConflictException('Role name already exists');
      }
    }

    this.roleRepository.merge(role, updateRoleDto);
    return await this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);

    // Verificar si hay usuarios con este rol
    if (role.users && role.users.length > 0) {
      throw new ConflictException(
        `Cannot delete role. ${role.users.length} user(s) are assigned to this role`,
      );
    }

    await this.roleRepository.remove(role);
  }

  // Seed de roles por defecto
  async seedDefaultRoles(): Promise<void> {
    const defaultRoles = [
      {
        roleName: 'ADMIN',
        description: 'Full system access',
      },
      {
        roleName: 'CASHIER',
        description: 'Sales and cash management',
      },
      {
        roleName: 'KITCHEN',
        description: 'Order and kitchen management',
      },
    ];

    for (const roleData of defaultRoles) {
      const exists = await this.findByName(roleData.roleName);
      if (!exists) {
        await this.create(roleData);
      }
    }
  }
}
