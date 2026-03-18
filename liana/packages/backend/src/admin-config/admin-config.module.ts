import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AdminSubcategoryEntryEntity,
  MunicipalityEntity,
} from '../common/entities';
import { AdminConfigController } from './admin-config.controller';
import { AdminConfigService } from './admin-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MunicipalityEntity,
      AdminSubcategoryEntryEntity,
    ]),
  ],
  controllers: [AdminConfigController],
  providers: [AdminConfigService],
  exports: [AdminConfigService],
})
export class AdminConfigModule {}
