import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PhotoModule } from './modules/photo/photo.module';
import { APP_GUARD } from '@nestjs/core';
import { LoginModule } from './modules/login/login.module';
import { LoginService } from './modules/login/login.service';
import { AdminModule } from './modules/admin/admin.module';
import { getSystemConfigs } from './init/check.config';
import { AuthGuard } from './common/guard/auth.guard';
const systemConfig = getSystemConfigs();
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: systemConfig.DB_MYSQL,
      port: parseInt(systemConfig.DB_PORT),
      username: systemConfig.DB_USER,
      password: systemConfig.DB_PASS,
      database: systemConfig.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    PhotoModule,
    LoginModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    LoginService,
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
