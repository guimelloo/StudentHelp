/**
 * ResourceModule
 * ===============================
 * Este módulo agrupa todos os componentes do recurso Resource.
 * Expansão:
 * - Adicione guards e interceptors
 */
import { Module } from '@nestjs/common';
import { ResourceService } from './resource.service';
import { ResourceController } from './resource.controller';

@Module({
  controllers: [ResourceController],
  providers: [ResourceService],
})
export class ResourceModule {}