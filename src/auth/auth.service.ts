import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

import * as bcrypt from 'bcrypt'
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  async create(createAuthDto: CreateUserDto) {
    try {

      const { password, ...userData } = createAuthDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10) //hasear la contraseña
      });

      await this.userRepository.save(user)
      delete user.password;

      return {
        ...user,
        token: this.getJwtToken({ id: user.id })
      };

    } catch (error) {
      this.handleDBError(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    // Revisa si el email existe
    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true }
    })

    if (!user)
      throw new UnauthorizedException('Credencial are not valid (email)')

    // Compara la contraseña
    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Credencial are not valid (password)')

    return {
      ...user,
      token: this.getJwtToken({ id: user.id }) // generar un nuevo token
    };


  }

  async checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({ id: user.id })
    };
  }

  private getJwtToken(paylaod: JwtPayload) {
    const token = this.jwtService.sign(paylaod);

    return token;
  }

  private handleDBError(error: any): never {
    if (error.code === '23505')
      throw new BadRequestException(error.detail)

    console.log(error);

    throw new InternalServerErrorException('Please check server logs')
  }
}
