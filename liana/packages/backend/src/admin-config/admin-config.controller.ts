import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@liana/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { CreateSubcategoryEntryDto } from './dto/create-subcategory-entry.dto';
import { AdminConfigService } from './admin-config.service';

@Controller('admin-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
export class AdminConfigController {
  constructor(private readonly adminConfigService: AdminConfigService) {}

  @Get('municipalities')
  listMunicipalities() {
    return this.adminConfigService.listMunicipalities();
  }

  @Post('municipalities')
  createMunicipality(@Body() dto: CreateMunicipalityDto) {
    return this.adminConfigService.createMunicipality(dto);
  }

  @Post('subcategory-entries')
  saveSubcategoryEntry(@Body() dto: CreateSubcategoryEntryDto) {
    return this.adminConfigService.saveSubcategoryEntry(dto);
  }

  @Get('subcategory-entries')
  getSubcategoryEntry(@Query('subcategory') subcategory: string) {
    return this.adminConfigService.getSubcategoryEntry(subcategory);
  }
}
