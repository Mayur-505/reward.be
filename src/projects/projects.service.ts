import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { CreateProjectDto, UpdateProjectDto } from './dto/create-project.dto';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(dto: CreateProjectDto): Promise<ProjectDocument> {
    const existing = await this.projectModel
      .findOne({ code: dto.code.toUpperCase() })
      .exec();
    if (existing) {
      throw new ConflictException(
        `Project with code '${dto.code}' already exists`,
      );
    }

    const apiKey = `pk_${randomBytes(20).toString('hex')}`;

    const project = new this.projectModel({
      name: dto.name,
      code: dto.code.toUpperCase(),
      description: dto.description ?? '',
      apiKey,
      settings: dto.settings ?? {},
    });

    return project.save();
  }

  async findAll(): Promise<ProjectDocument[]> {
    return this.projectModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<ProjectDocument> {
    let project: ProjectDocument | null = null;
    if (Types.ObjectId.isValid(id)) {
      project = await this.projectModel.findById(id).exec();
    }
    if (!project) {
      project = await this.projectModel
        .findOne({ code: id.toUpperCase() })
        .exec();
    }
    if (!project) {
      throw new NotFoundException(`Project with ID or code '${id}' not found`);
    }
    return project;
  }

  async findByCode(code: string): Promise<ProjectDocument> {
    const project = await this.projectModel
      .findOne({ code: code.toUpperCase() })
      .exec();
    if (!project) {
      throw new NotFoundException(`Project with code '${code}' not found`);
    }
    return project;
  }

  async findByApiKey(apiKey: string): Promise<ProjectDocument | null> {
    return this.projectModel.findOne({ apiKey, isActive: true }).exec();
  }

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectDocument> {
    const project = await this.findById(id);

    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description;
    if (dto.isActive !== undefined) project.isActive = dto.isActive;
    if (dto.settings) {
      project.settings = {
        ...project.settings,
        ...dto.settings,
      };
    }

    return project.save();
  }

  async regenerateApiKey(id: string): Promise<ProjectDocument> {
    const project = await this.findById(id);
    project.apiKey = `pk_${randomBytes(20).toString('hex')}`;
    return project.save();
  }
}
