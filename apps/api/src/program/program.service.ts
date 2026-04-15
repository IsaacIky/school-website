import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProgramDto) {
    const existing = await this.prisma.program.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Program with code '${dto.code}' already exists`);
    return this.prisma.program.create({ data: dto });
  }

  findAll(departmentId?: string) {
    return this.prisma.program.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: {
          include: { faculty: { include: { campus: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        department: {
          include: { faculty: { include: { campus: true } } },
        },
      },
    });
    if (!program) throw new NotFoundException(`Program ${id} not found`);
    return program;
  }

  async update(id: string, dto: UpdateProgramDto) {
    await this.findOne(id);
    return this.prisma.program.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.program.delete({ where: { id } });
  }
}
