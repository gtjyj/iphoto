import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PhotoService } from '../photo/photo.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from 'src/entities/photo.entity';
import { Task } from 'src/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Photo, Task])],
  controllers: [AdminController],
  providers: [AdminService, PhotoService],
})
export class AdminModule {}
