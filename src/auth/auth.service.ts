import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, ChangePasswordDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    const { ...userWithoutPassword } = user;

    const payload: JwtPayload = {
      sub: user.idUser,
      email: user.email,
    };

    return {
      user: userWithoutPassword,
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User inactive');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Actualizar último acceso
    await this.usersService.updateLastAccess(user.idUser);

    const { ...userWithoutPassword } = user;

    const payload: JwtPayload = {
      sub: user.idUser,
      email: user.email,
    };

    return {
      user: userWithoutPassword,
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ message: string }> {
    // Recuperar el usuario con el hash — la columna passwordHash tiene select:false
    // por eso necesitamos findByEmail que hace el addSelect explícito
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      // Mensaje genérico: no revelamos si el email existe o cuál campo es incorrecto
      throw new UnprocessableEntityException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(userId, newPasswordHash);

    return { message: 'Password updated successfully' };
  }
}
