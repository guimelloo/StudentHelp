/**
 * ResourceController
 * ================================
 * Controlador que gerencia as requisições HTTP para o recurso Resource.
 * Expansão:
 * - Adicione validação com pipes
 * - Adicione autenticação/autorização
 */
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ResourceService } from './resource.service';
import { CreateResourceDto, UpdateResourceDto } from './resource.dto';

@Controller('api/resource')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Post()
  create(@Body() createResourceDto: CreateResourceDto) {
    return this.resourceService.create(createResourceDto);
  }

  @Get()
  findAll() {
    return this.resourceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourceService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateResourceDto: UpdateResourceDto) {
    return this.resourceService.update(+id, updateResourceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resourceService.remove(+id);
  }
}
