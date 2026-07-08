import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const emailExists = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (emailExists) {
      throw new ConflictException('Email already registered');
    }

    // Hashear password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // Crear usuario
    const user = this.userRepository.create({
      ...createUserDto,
      passwordHash,
    });

    // Guardar y retornar
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      //where: { isActive: true },
      relations: ['role'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<User[]> {
    return await this.userRepository.find({
      where: { isActive: true },
      relations: ['role'],
      order: { createdAt: 'DESC' },
    });
  }

  async findInactive(): Promise<User[]> {
    return await this.userRepository.find({
      where: { isActive: false },
      relations: ['role'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { idUser: id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      select: ['idUser', 'fullName', 'email', 'passwordHash', 'isActive', 'roleId'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Si se intenta actualizar el email, verificar que no exista
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.userRepository.findOne({
        where: { email: updateUserDto.email as string },
      });

      if (emailExists) {
        throw new ConflictException('Email already registered');
      }
    }

    // Actualizar con spread operator
    const updatedUser = { ...user, ...updateUserDto };
    return await this.userRepository.save(updatedUser);
  }
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    // Soft delete
    user.isActive = false;
    await this.userRepository.save(user);
  }

  async updateLastAccess(id: number): Promise<void> {
    await this.userRepository.update(id, {
      lastAccess: new Date(),
    });
  }

  // Busca por ID incluyendo passwordHash (columna select:false).
  // Usado exclusivamente por AuthService.changePassword() para verificar la contraseña actual.
  async findById(id: number): Promise<User | null> {
    return await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.idUser = :id', { id })
      .getOne();
  }

  // Actualiza solo el hash de la contraseña. No toca ningún otro campo del perfil.
  async updatePassword(id: number, newPasswordHash: string): Promise<void> {
    await this.userRepository.update(id, { passwordHash: newPasswordHash });
  }
}
