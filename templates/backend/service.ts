/**
 * ResourceService
 * ================================
 * Serviço que contém a lógica de negócio para o recurso Resource.
 * Expansão:
 * - Adicione validação de regras de negócio
 * - Adicione paginação
 * - Adicione filtros avançados
 */
import { Injectable } from '@nestjs/common';
import { CreateResourceDto, UpdateResourceDto } from './resource.dto';

@Injectable()
export class ResourceService {
  private data: any[] = [];
  private id = 1;

  create(createResourceDto: CreateResourceDto) {
    const resource = {
      id: this.id++,
      ...createResourceDto,
      createdAt: new Date(),
    };
    this.data.push(resource);
    return resource;
  }

  findAll() {
    return this.data;
  }

  findOne(id: number) {
    return this.data.find(item => item.id === id);
  }

  update(id: number, updateResourceDto: UpdateResourceDto) {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updateResourceDto, updatedAt: new Date() };
      return this.data[index];
    }
    return null;
  }

  remove(id: number) {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      return this.data.splice(index, 1);
    }
    return null;
  }
}
