import { Controller, Post, Body } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginDto } from './dto/login.dto';
import { ResultUtils } from 'src/utils/result-utils';
import { Public } from '../../common/guard/auth.guard';
import { getSystemConfigs } from 'src/init/check.config';
const systemConfig = getSystemConfigs();

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  @Public()
  async login(@Body() loginDto: LoginDto) {
    const { password } = loginDto;
    const adminPassword = systemConfig.ADMIN_PASSWORD;
    if (password !== adminPassword) {
      return ResultUtils.fail('密码错误');
    }
    return ResultUtils.success(this.loginService.generateToken(password));
  }
}
