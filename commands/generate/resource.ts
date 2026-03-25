import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export async function generateResource(resourceName) {
  const resourceLower = resourceName.toLowerCase();
  const resourcePascal = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);

  console.log(chalk.blue.bold(`\n📦 Generating resource: ${resourcePascal}\n`));

  try {
    // Backend
    console.log(chalk.cyan('Backend:'));
    const backendPath = path.join(process.cwd(), 'backend/src', resourceLower);
    fs.ensureDirSync(backendPath);

    // Helper function to replace template variables
    const replaceContent = (content, name) => {
      return content
        .replace(/Resource/g, name)
        .replace(/resource/g, name.toLowerCase());
    };

    // Copy and customize files
    const moduleTemplate = fs.readFileSync(path.resolve('.', 'node_modules/student-help/templates/backend/module.ts'), 'utf-8').catch(() => 
      fs.readFileSync(path.resolve(import.meta.url, '../../../templates/backend/module.ts'), 'utf-8')
    );

    const backendDir = path.resolve('.', 'node_modules/student-help/templates/backend');
    const templatesDir = path.resolve(import.meta.url, '../../../templates/backend');
    
    // Try to find templates
    let templateDir = null;
    if (fs.existsSync(backendDir)) {
      templateDir = backendDir;
    } else if (fs.existsSync(templatesDir)) {
      templateDir = templatesDir;
    } else {
      // Create from scratch if templates not found
      console.log(chalk.yellow('⚠️  Templates not found, creating basic structure...\n'));
      
      // Module
      fs.writeFileSync(
        path.join(backendPath, `${resourceLower}.module.ts`),
        `import { Module } from '@nestjs/common';
import { ${resourcePascal}Service } from './${resourceLower}.service';
import { ${resourcePascal}Controller } from './${resourceLower}.controller';

@Module({
  controllers: [${resourcePascal}Controller],
  providers: [${resourcePascal}Service],
})
export class ${resourcePascal}Module {}
`);

      // Service
      fs.writeFileSync(
        path.join(backendPath, `${resourceLower}.service.ts`),
        `import { Injectable } from '@nestjs/common';
import { Create${resourcePascal}Dto, Update${resourcePascal}Dto } from './${resourceLower}.dto';

@Injectable()
export class ${resourcePascal}Service {
  create(create${resourcePascal}Dto: Create${resourcePascal}Dto) {
    return { message: 'Create endpoint for ${resourcePascal}' };
  }

  findAll() {
    return { message: 'Find all ${resourcePascal}' };
  }

  findOne(id: number) {
    return { message: \`Find ${resourcePascal} with id \${id}\` };
  }

  update(id: number, update${resourcePascal}Dto: Update${resourcePascal}Dto) {
    return { message: \`Update ${resourcePascal} with id \${id}\` };
  }

  remove(id: number) {
    return { message: \`Remove ${resourcePascal} with id \${id}\` };
  }
}
`);

      // Controller
      fs.writeFileSync(
        path.join(backendPath, `${resourceLower}.controller.ts`),
        `import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ${resourcePascal}Service } from './${resourceLower}.service';
import { Create${resourcePascal}Dto, Update${resourcePascal}Dto } from './${resourceLower}.dto';

@Controller('${resourceLower}')
export class ${resourcePascal}Controller {
  constructor(private readonly ${resourceLower}Service: ${resourcePascal}Service) {}

  @Post()
  create(@Body() create${resourcePascal}Dto: Create${resourcePascal}Dto) {
    return this.${resourceLower}Service.create(create${resourcePascal}Dto);
  }

  @Get()
  findAll() {
    return this.${resourceLower}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${resourceLower}Service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() update${resourcePascal}Dto: Update${resourcePascal}Dto) {
    return this.${resourceLower}Service.update(+id, update${resourcePascal}Dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${resourceLower}Service.remove(+id);
  }
}
`);

      // DTO
      fs.writeFileSync(
        path.join(backendPath, `${resourceLower}.dto.ts`),
        `export class Create${resourcePascal}Dto {
  title: string;
  description?: string;
}

export class Update${resourcePascal}Dto {
  title?: string;
  description?: string;
}
`);
      
      console.log('  ✅ Module created');
      console.log('  ✅ Service created');
      console.log('  ✅ Controller created');
      console.log('  ✅ DTO created');
    }

    // Frontend
    console.log(chalk.cyan('\nFrontend:'));
    const frontendPath = path.join(process.cwd(), 'app', resourceLower);
    fs.ensureDirSync(frontendPath);

    // Create a basic page component
    fs.writeFileSync(
      path.join(frontendPath, 'page.tsx'),
      `'use client';

import React from 'react';

export default function ${resourcePascal}Page() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">${resourcePascal} Management</h1>
      <p className="text-gray-600">This is the ${resourcePascal} CRUD page. Start implementing here!</p>
    </div>
  );
}
`);

    console.log(`  ✅ Page created in app/${resourceLower}`);

    console.log(chalk.green.bold(`\n✅ Resource ${resourcePascal} generated successfully!\n`));
    console.log(chalk.yellow('Next steps:'));
    console.log(`  1. Register the module in backend/src/app.module.ts`);
    console.log(`  2. Implement service logic`);
    console.log(`  3. Create frontend interface in Next.js\n`);

  } catch (error) {
    console.error(chalk.red('Error generating resource:'), error.message);
    throw error;
  }
}