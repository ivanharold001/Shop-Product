import { Controller, Post, Body, Get, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { RawHeaders } from './decorators/raw-headers.decorator';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { RoleProtected } from './decorators/role-protected.decorator';
import { ValidRoles } from './interfaces/valida-roles';
import { Auth } from './decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-auth-status')
  @Auth()
  checkAuthStatus(
    @GetUser() user: User
  ) {
    return this.authService.checkAuthStatus(user);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    // @Req() request: Express.Request
    @GetUser() user: User,
    @GetUser('email') userEmail: string,

    @RawHeaders() rawHeaders: string[],
  ) {


    return {
      ok: true,
      messaje: "Hola mundo",
      user,
      userEmail,
      rawHeaders,
    }
  }

  @Get('private2')
  // @SetMetadata('roles', ['admin', 'super-user'])
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard(), UserRoleGuard)
  privateRoute2(
    @GetUser() user: User
  ) {
    return {
      ok: true,
      user
    }
  }

  @Get('private3')
  // @SetMetadata('roles', ['admin', 'super-user'])
  // @RoleProtected(ValidRoles.admin)
  // @UseGuards(AuthGuard(), UserRoleGuard)
  @Auth(ValidRoles.admin)
  privateRoute3(
    @GetUser() user: User
  ) {
    return {
      ok: true,
      user
    }
  }
}
