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
import { AuthGuard } from './common/guard/auth.guard';
import { getDBConnConfig } from './utils/util';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        return getDBConnConfig();
      },
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
