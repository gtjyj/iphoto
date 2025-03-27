import { StorageType } from './enums';

export type SystemConfig = {
  INSTANCE_ID: string;
  ADMIN_PASSWORD: string;
  LOGIN_EXPIRED: string;
  REQUEST_LIMIT_INTERVAL: string;
  REQUEST_LIMIT: string;
  DB_MYSQL: string;
  DB_USER: string;
  DB_PASS: string;
  DB_PORT: string;
  DB_NAME: string;
  STORAGE: StorageType;

  // 腾讯云
  COS_SECRET_ID?: string;
  COS_SECRET_KEY?: string;
  COS_BUCKET?: string;
  COS_REGION?: string;
  COS_ACCESS_TYPE?: string;
  COS_ACCESS_URL?: string;

  // 阿里云
  ALI_COS_SECRET_ID?: string;
  ALI_COS_SECRET_KEY?: string;
  ALI_COS_BUCKET?: string;
  ALI_COS_REGION?: string;
  ALI_COS_ACCESS_TYPE?: string;
  ALI_COS_ACCESS_URL?: string;

  // webdav
  WEBDAV_URL?: string;
  WEBDAV_USER?: string;
  WEBDAV_PASSWORD?: string;

  ENCRYPTION_KEY?: string;
  ENCRYPTION_IV?: string;
};

export type InputConfigItem = {
  key: string;
  label: string;
  type: 'text' | 'password' | 'radio';
  value?: string;
  require: boolean;
  options?: {
    key: string;
    label: string;
  }[];
  when?: {
    key: string;
    value: string;
  }[];
};

export type InitInputs = InputConfigItem[];
