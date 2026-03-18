import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AdminSubcategoryEntryEntity,
  MunicipalityEntity,
} from '../common/entities';
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { CreateSubcategoryEntryDto } from './dto/create-subcategory-entry.dto';

@Injectable()
export class AdminConfigService {
  constructor(
    @InjectRepository(MunicipalityEntity)
    private readonly municipalityRepo: Repository<MunicipalityEntity>,
    @InjectRepository(AdminSubcategoryEntryEntity)
    private readonly subcategoryEntryRepo: Repository<AdminSubcategoryEntryEntity>,
  ) {}

  async listMunicipalities() {
    return this.municipalityRepo.find({
      where: { active: true },
      order: { name: 'ASC' },
    });
  }

  async createMunicipality(dto: CreateMunicipalityDto) {
    const normalized = dto.name.trim();
    const existing = await this.municipalityRepo.findOne({
      where: { name: normalized },
    });

    if (existing) {
      return existing;
    }

    const entity = this.municipalityRepo.create({ name: normalized });
    return this.municipalityRepo.save(entity);
  }

  async saveSubcategoryEntry(dto: CreateSubcategoryEntryDto) {
    const entry = this.subcategoryEntryRepo.create({
      subcategory: dto.subcategory,
      data: dto.data,
    });
    return this.subcategoryEntryRepo.save(entry);
  }
}
