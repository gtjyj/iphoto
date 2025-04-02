import { existsSync } from 'fs';
import { resolve } from 'path';
import { checkDBisValid, checkParamsRequire } from './check.config';
import { InitInputs, SystemConfig } from '../types/system.config';
const configInputs = resolve(process.env.ROOT_DIR + '/init.json');
export const checkSubmitConfig = async (body: SystemConfig) => {
  const configData: InitInputs = await import(configInputs);
  if (!checkParamsRequire(body, configData)) {
    return '请检查所有必填项';
  } else if (!(await checkDBisValid(body))) {
    return '请检查您的数据库配置, 无法联通';
  }
  return '';
};

export const getSystemConfigTemplate = async (): Promise<InitInputs> => {
  if (existsSync(configInputs)) {
    const configData: InitInputs = await import(configInputs);
    return configData;
  }
};
