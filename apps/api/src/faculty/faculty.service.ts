import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@Injectable()
export class FacultyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFacultyDto) {
    const existing = await this.prisma.faculty.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Faculty with code '${dto.code}' already exists`);
    return this.prisma.faculty.create({ data: dto });
  }

  findAll(campusId?: string) {
    return this.prisma.faculty.findMany({
      where: campusId ? { campusId } : undefined,
      include: { campus: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: {
        campus: true,
        departments: true,
      },
    });
    if (!faculty) throw new NotFoundException(`Faculty ${id} not found`);
    return faculty;
  }

  async update(id: string, dto: UpdateFacultyDto) {
    await this.findOne(id);
    return this.prisma.faculty.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.faculty.delete({ where: { id } });
  }
}
