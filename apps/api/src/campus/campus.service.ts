import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';

@Injectable()
export class CampusService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCampusDto) {
    const existing = await this.prisma.campus.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Campus with code '${dto.code}' already exists`);
    return this.prisma.campus.create({ data: dto });
  }

  findAll() {
    return this.prisma.campus.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { id },
      include: { faculties: true },
    });
    if (!campus) throw new NotFoundException(`Campus ${id} not found`);
    return campus;
  }

  async update(id: string, dto: UpdateCampusDto) {
    await this.findOne(id);
    return this.prisma.campus.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.campus.delete({ where: { id } });
  }
}
