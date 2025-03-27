import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { InitInputs, SystemConfig } from './types/system.config';
import {
  checkSubmitConfig,
  getSystemConfigTemplate,
} from './init/system.config.utils';
import { ResponseDto } from './modules/photo/dto/response.dto';
import { ResultUtils } from './utils/result-utils';
import { getSystemConfigs, setSystemConfigs } from './init/check.config';
import { restartSystem } from './utils/util';
import { Public } from './common/guard/auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('ready')
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/getConfigTemplate')
  async getConfigTemplate(): Promise<InitInputs> {
    return await getSystemConfigTemplate();
  }

  @Post('submitConfig')
  async submitConfig(@Body() body: SystemConfig): Promise<ResponseDto<any>> {
    const result = await checkSubmitConfig(body);
    if (result) {
      return ResultUtils.fail(result);
    } else {
      await setSystemConfigs(body);
      const result = restartSystem();
      return ResultUtils.success(null, result);
    }
  }

  @Post('getConfig')
  async getConfig(): Promise<ResponseDto<Partial<SystemConfig>>> {
    return ResultUtils.success(getSystemConfigs());
  }
}
