/**
 * Resource DTOs
 * ================================
 * Data Transfer Objects para validação de entrada do recurso Resource.
 * Expansão:
 * - Adicione validação com class-validator
 * - Adicione transformação com class-transformer
 */

export class CreateResourceDto {
  title: string;
  description?: string;
  content?: string;
}

export class UpdateResourceDto {
  title?: string;
  description?: string;
  content?: string;
}
