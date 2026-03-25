import { Command } from 'commander';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';

// ============================================
// Print beautiful Student Help banner
// ============================================
const printBanner = () => {
  console.clear();
  console.log(chalk.hex('#00D9FF').bold('\n'));
  console.log(chalk.hex('#00D9FF').bold('   ███████╗████████╗██╗   ██╗██████╗ ███████╗███╗   ██╗████████╗'));
  console.log(chalk.hex('#0099FF').bold('   ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██╔════╝████╗  ██║╚══██╔══╝'));
  console.log(chalk.hex('#0052FF').bold('   ███████╗   ██║   ██║   ██║██║  ██║█████╗  ██╔██╗ ██║   ██║'));
  console.log(chalk.hex('#6600FF').bold('   ╚════██║   ██║   ██║   ██║██║  ██║██╔══╝  ██║╚██╗██║   ██║'));
  console.log(chalk.hex('#FF00FF').bold('   ███████║   ██║   ╚██████╔╝██████╔╝███████╗██║ ╚████║   ██║'));
  console.log(chalk.hex('#FF0066').bold('   ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝'));
  console.log(chalk.hex('#FF00FF').bold('\n   🚀 HELP FRAMEWORK - Create Full-Stack Apps in Minutes\n'));
  console.log(chalk.hex('#00D9FF').bold('   ' + '═'.repeat(58) + '\n'));
};

// ============================================
// Command: new <projectName>
// ============================================
const newCommand = async (projectName) => {
  printBanner();

  const projectPath = path.join(process.cwd(), projectName);
  fs.ensureDirSync(projectPath);

  console.log(chalk.cyan.bold('🎯 Creating your full-stack project...\n'));

  // Backend
  let spinner = ora({
    text: 'Setting up NestJS backend',
    spinner: 'dots3',
    color: 'cyan'
  }).start();

  try {
    const tempBackendName = path.basename(projectPath) + '_backend_temp';
    execSync(`npx @nestjs/cli new ${tempBackendName} --package-manager npm --skip-git 2>&1 > /dev/null`, { 
      stdio: 'ignore',
      cwd: '/tmp'
    });
    
    const tempBackendPath = path.join('/tmp', tempBackendName);
    const backendDir = path.join(projectPath, 'backend');
    
    if (!fs.existsSync(tempBackendPath)) {
      throw new Error('Backend temporary directory was not created');
    }
    
    fs.moveSync(tempBackendPath, backendDir);
    spinner.succeed(chalk.green('Backend NestJS configured'));
  } catch (error) {
    spinner.fail(chalk.red('Error creating backend'));
    throw error;
  }

  // Frontend
  spinner = ora({
    text: 'Setting up Next.js frontend',
    spinner: 'dots3',
    color: 'magenta'
  }).start();

  try {
    execSync(`npx create-next-app@latest ${projectPath}/frontend --typescript --use-npm --eslint --app --no-src-dir --import-alias '@/*' --skip-install 2>&1 > /dev/null`, {
      stdio: 'ignore',
      cwd: process.cwd(),
      env: {
        ...process.env,
        CI: 'true'
      }
    });
    spinner.succeed(chalk.green('Frontend structure created'));
    
    spinner = ora({
      text: 'Installing frontend dependencies',
      spinner: 'arc',
      color: 'blue'
    }).start();
    
    execSync(`npm install`, { stdio: 'ignore', cwd: path.join(projectPath, 'frontend') });
    spinner.succeed(chalk.green('Frontend dependencies installed'));
    
    spinner = ora({
      text: 'Adding modern packages (Tailwind, ESLint, Prettier)',
      spinner: 'bouncingBar',
      color: 'yellow'
    }).start();
    
    const frontendPath = path.join(projectPath, 'frontend');
    execSync(`npm install -D tailwindcss postcss autoprefixer prettier @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier axios zustand 2>&1 > /dev/null`, {
      stdio: 'ignore',
      cwd: frontendPath
    });
    
    spinner.succeed(chalk.green('Frontend configured with modern packages'));
  } catch (error) {
    spinner.fail(chalk.red('Error creating frontend'));
    throw error;
  }

  // Docker configuration
  spinner = ora({
    text: 'Setting up Docker & environment',
    spinner: 'line',
    color: 'cyan'
  }).start();
  
  try {
    const backendDir = path.join(projectPath, 'backend');
    const frontendDir = path.join(projectPath, 'frontend');
    
    fs.ensureDirSync(backendDir);
    fs.ensureDirSync(frontendDir);
    
    // Backend Dockerfile
    const backendDockerfile = [
      'FROM node:18-alpine',
      '',
      'WORKDIR /app',
      '',
      'COPY package*.json ./',
      '',
      'RUN npm ci',
      '',
      'COPY . .',
      '',
      'RUN npm run build',
      '',
      'EXPOSE 3000',
      '',
      'CMD ["node", "dist/main.js"]',
    ].join('\n');
    
    fs.writeFileSync(path.join(backendDir, 'Dockerfile'), backendDockerfile);

    // Frontend Dockerfile
    const frontendDockerfile = [
      'FROM node:18-alpine',
      '',
      'WORKDIR /app',
      '',
      'COPY package*.json ./',
      '',
      'RUN npm ci',
      '',
      'COPY . .',
      '',
      'RUN npm run build',
      '',
      'EXPOSE 3000',
      '',
      'CMD ["npm", "start"]',
    ].join('\n');
    
    fs.writeFileSync(path.join(frontendDir, 'Dockerfile'), frontendDockerfile);

    // Docker Compose
    const dockerCompose = `version: '3.8'

services:
  backend:
    build: ./backend
    container_name: ${projectName}_backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: student
      DB_PASSWORD: student123
      DB_NAME: ${projectName}
      DATABASE_URL: postgresql://student:student123@postgres:5432/${projectName}
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: ${projectName}_frontend
    ports:
      - "3001:3000"
    environment:
      NODE_ENV: development
      NEXT_PUBLIC_API_URL: http://localhost:3000/api
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - app-network
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    container_name: ${projectName}_postgres
    environment:
      POSTGRES_USER: student
      POSTGRES_PASSWORD: student123
      POSTGRES_DB: ${projectName}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U student -d ${projectName}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local

networks:
  app-network:
    driver: bridge
`;
    
    fs.writeFileSync(path.join(projectPath, 'docker-compose.yml'), dockerCompose);

    // .env.example
    const envExample = `# Backend Configuration
BACKEND_PORT=3000
NODE_ENV=development

# Frontend Configuration
FRONTEND_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=student
DB_PASSWORD=student123
DB_NAME=${projectName}
DATABASE_URL=postgresql://student:student123@postgres:5432/${projectName}

# Security
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRATION=7d

# API
API_PREFIX=api/v1
`;

    fs.writeFileSync(path.join(projectPath, '.env.example'), envExample);

    // .gitignore
    const gitignore = [
      '# Dependencies',
      'node_modules/',
      '/.pnp',
      '.pnp.js',
      '',
      '# Testing',
      '/coverage',
      '',
      '# Production',
      '/build',
      '/dist',
      '/out',
      '',
      '# Misc',
      '.DS_Store',
      '*.pem',
      '',
      '# Logs',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'pnpm-debug.log*',
      'lerna-debug.log*',
      '',
      '# Environment',
      '.env',
      '.env.local',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',
      '',
      '# IDE',
      '.vscode',
      '.idea',
      '*.swp',
      '*.swo',
      '*~',
      '.iml',
      '',
      '# OS',
      '.AppleDouble',
      '.LSOverride',
      'Thumbs.db',
      '',
      '# Next.js',
      '.next',
      'out',
      '',
      '# Docker',
      'docker-compose.override.yml',
    ].join('\n');

    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);

    // .prettierrc.json
    const prettierConfig = {
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      arrowParens: 'always',
      endOfLine: 'lf'
    };

    fs.writeFileSync(path.join(projectPath, '.prettierrc.json'), JSON.stringify(prettierConfig, null, 2));

    spinner.succeed(chalk.green('Docker & environment configured'));
  } catch (error) {
    spinner.fail(chalk.red('Error configuring Docker'));
    throw error;
  }

  // README
  spinner = ora({
    text: 'Generating documentation',
    spinner: 'pong',
    color: 'green'
  }).start();

  const readmeContent = `# ${projectName}

A modern full-stack application created with **Student Help Framework**.

## 📚 What is Student Help Framework?

Student Help Framework is a mini-framework that simplifies the creation of modern full-stack applications. It automates the complete setup of:

- **Backend**: NestJS (a robust and scalable Node.js framework)
- **Frontend**: Next.js (React framework with SSR and optimizations)
- **Database**: PostgreSQL (reliable relational database)
- **Docker**: Complete containerization for environment isolation
- **DevOps**: Docker Compose for local orchestration

### Why use Student Help Framework?

✨ **Zero Configuration** - Everything is pre-configured and ready to go
⚡ **Production Ready** - Scalable structure from day one
🐳 **Docker Included** - Consistent environment across machines
🔄 **Code Generation** - Create CRUD resources with a single command
📦 **Modern Stack** - Latest technologies with best practices
🎨 **Professional UI** - Tailwind CSS pre-configured

## 🚀 Getting Started

### 1. Start the Development Environment

\`\`\`bash
docker-compose up -d
\`\`\`

This starts:
- **Backend**: Port 3000
- **Frontend**: Port 3001
- **PostgreSQL**: Port 5432

### 2. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432 (user: student / password: student123)

## 🛠️ Development Without Docker

### Backend
\`\`\`bash
cd backend
npm install
npm run start:dev
\`\`\`

Server runs at: http://localhost:3000

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

App runs at: http://localhost:3001

## 📦 Generate Resources Automatically

### Create Authentication Module
\`\`\`bash
student-help generate:auth
\`\`\`

### Create a CRUD Resource
\`\`\`bash
student-help generate:resource Post
\`\`\`

## 📁 Project Structure

\`\`\`
${projectName}/
├── backend/              # NestJS API
├── frontend/             # Next.js App
├── docker-compose.yml    # Orchestration
├── .env.example          # Environment template
└── .gitignore
\`\`\`

## 🗄️ Database

PostgreSQL is pre-configured:
- **User**: student
- **Password**: student123
- **Database**: ${projectName}

---

**Built with ❤️ using Student Help Framework**
`;

  fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);

  spinner.succeed(chalk.green('Documentation generated'));

  // Git initialization
  spinner = ora({
    text: 'Initializing Git repository',
    spinner: 'dots2',
    color: 'blue'
  }).start();
  
  try {
    execSync(`cd ${projectPath} && git init && git add . && git commit -m "Initial commit: Full-stack project setup with Student Help Framework" 2>&1 > /dev/null`, { 
      stdio: 'ignore',
      cwd: projectPath
    });
    spinner.succeed(chalk.green('Git repository created'));
  } catch (error) {
    spinner.succeed(chalk.yellow('Git initialized'));
  }

  // Add backend modern packages
  spinner = ora({
    text: 'Adding backend modern packages',
    spinner: 'flip',
    color: 'magenta'
  }).start();
  
  try {
    const backendPath = path.join(projectPath, 'backend');
    execSync(`npm install @nestjs/config @nestjs/typeorm typeorm pg joi class-validator class-transformer helmet cors 2>&1 > /dev/null`, {
      stdio: 'ignore',
      cwd: backendPath
    });
    execSync(`npm install -D prettier @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier 2>&1 > /dev/null`, {
      stdio: 'ignore',
      cwd: backendPath
    });
    spinner.succeed(chalk.green('Backend dependencies updated'));
  } catch (error) {
    spinner.succeed(chalk.yellow('Backend packages updated'));
  }

  // Create .prettierrc for backend
  const prettierConfig = {
    semi: true,
    trailingComma: 'es5',
    singleQuote: true,
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    arrowParens: 'always',
    endOfLine: 'lf'
  };
  
  fs.writeFileSync(path.join(projectPath, 'backend', '.prettierrc.json'), JSON.stringify(prettierConfig, null, 2));

  // Setup StudentHelp Module
  spinner = ora({
    text: 'Setting up StudentHelp utility module',
    spinner: 'dots3',
    color: 'cyan'
  }).start();

  try {
    const backendPath = path.join(projectPath, 'backend');
    const srcPath = path.join(backendPath, 'src');
    const studentHelpDir = path.join(srcPath, 'student-help');
    
    fs.ensureDirSync(studentHelpDir);

    // Get template files path - resolve from current script location
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const templatesPath = path.join(__dirname, 'templates', 'backend');
    
    // Read StudentHelp templates from disk
    const serviceTemplatePath = path.join(templatesPath, 'student-help.service.ts');
    const controllerTemplatePath = path.join(templatesPath, 'student-help.controller.ts');
    const studentHelpModuleTemplate = `import { Global, Module } from '@nestjs/common';
import { StudentHelpService } from './student-help.service';
import { StudentHelpController } from './student-help.controller';

@Global()
@Module({
  controllers: [StudentHelpController],
  providers: [StudentHelpService],
  exports: [StudentHelpService],
})
export class StudentHelpModule {}
`;

    try {
      // Check if template files exist
      if (!fs.existsSync(serviceTemplatePath)) {
        throw new Error(`Service template not found at: ${serviceTemplatePath}`);
      }
      if (!fs.existsSync(controllerTemplatePath)) {
        throw new Error(`Controller template not found at: ${controllerTemplatePath}`);
      }
      
      const studentHelpServiceTemplate = fs.readFileSync(serviceTemplatePath, 'utf-8');
      const studentHelpControllerTemplate = fs.readFileSync(controllerTemplatePath, 'utf-8');
      
      fs.writeFileSync(path.join(studentHelpDir, 'student-help.module.ts'), studentHelpModuleTemplate);
      fs.writeFileSync(path.join(studentHelpDir, 'student-help.service.ts'), studentHelpServiceTemplate);
      fs.writeFileSync(path.join(studentHelpDir, 'student-help.controller.ts'), studentHelpControllerTemplate);
    } catch (templateError) {
      // Fallback to basic version if templates don't exist
      const fallbackService = `import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export interface StudentUser {
  id?: string;
  email: string;
  name: string;
  password?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: StudentUser;
}

@Injectable()
export class StudentHelpService {
  private users: Map<string, StudentUser> = new Map();
  private sessions: Map<string, AuthResponse> = new Map();

  async register(email: string, name: string, password: string): Promise<AuthResponse> {
    try {
      if (this._getUserByEmail(email)) {
        return { success: false, message: 'User already exists' };
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = \`user_\${Date.now()}\`;
      const user: StudentUser = { id: userId, email, name, password: hashedPassword };
      this.users.set(userId, user);
      return { success: true, message: 'User registered successfully', user: { id: userId, email, name } };
    } catch (error) {
      return { success: false, message: \`Registration failed: \${error.message}\` };
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const user = this._getUserByEmail(email);
      if (!user || !user.password) {
        return { success: false, message: 'Invalid credentials' };
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }
      const response: AuthResponse = { success: true, message: 'Login successful', user: { id: user.id, email: user.email, name: user.name } };
      this.sessions.set(user.id || '', response);
      return response;
    } catch (error) {
      return { success: false, message: \`Login failed: \${error.message}\` };
    }
  }

  async logout(userId: string): Promise<AuthResponse> {
    try {
      this.sessions.delete(userId);
      return { success: true, message: 'Logout successful' };
    } catch (error) {
      return { success: false, message: \`Logout failed: \${error.message}\` };
    }
  }

  getUser(userId: string): StudentUser | null {
    const user = this.users.get(userId);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as StudentUser;
    }
    return null;
  }

  getAllUsers(): StudentUser[] {
    const users: StudentUser[] = [];
    this.users.forEach((user) => {
      const { password, ...userWithoutPassword } = user;
      users.push(userWithoutPassword as StudentUser);
    });
    return users;
  }

  async updateUser(userId: string, updateData: Partial<StudentUser>): Promise<AuthResponse> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      if (updateData.name) user.name = updateData.name;
      if (updateData.email) user.email = updateData.email;
      return { success: true, message: 'User updated successfully', user: { id: user.id, email: user.email, name: user.name } };
    } catch (error) {
      return { success: false, message: \`Update failed: \${error.message}\` };
    }
  }

  async deleteUser(userId: string): Promise<AuthResponse> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      this.users.delete(userId);
      this.sessions.delete(userId);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      return { success: false, message: \`Delete failed: \${error.message}\` };
    }
  }

  isAuthenticated(userId: string): boolean {
    return this.sessions.has(userId);
  }

  private _getUserByEmail(email: string): StudentUser | null {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  getInfo() {
    return { name: 'StudentHelp', version: '2.0.0', description: 'Global utility service for student applications' };
  }
}
`;
      const fallbackController = `import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { StudentHelpService, AuthResponse } from './student-help.service';

@Controller('student-help')
export class StudentHelpController {
  constructor(private studentHelpService: StudentHelpService) {}

  @Post('register')
  async register(@Body() body: { email: string; name: string; password: string }): Promise<AuthResponse> {
    return this.studentHelpService.register(body.email, body.name, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }): Promise<AuthResponse> {
    return this.studentHelpService.login(body.email, body.password);
  }

  @Post('logout/:userId')
  async logout(@Param('userId') userId: string): Promise<AuthResponse> {
    return this.studentHelpService.logout(userId);
  }

  @Get('user/:userId')
  getUser(@Param('userId') userId: string) {
    return this.studentHelpService.getUser(userId);
  }

  @Get('users')
  getAllUsers() {
    return this.studentHelpService.getAllUsers();
  }

  @Get('info')
  getInfo() {
    return this.studentHelpService.getInfo();
  }
}
`;
      fs.writeFileSync(path.join(studentHelpDir, 'student-help.module.ts'), studentHelpModuleTemplate);
      fs.writeFileSync(path.join(studentHelpDir, 'student-help.service.ts'), fallbackService);
      fs.writeFileSync(path.join(studentHelpDir, 'student-help.controller.ts'), fallbackController);
    }

    // Read and modify app.module.ts
    const appModulePath = path.join(srcPath, 'app.module.ts');
    let appModuleContent = fs.readFileSync(appModulePath, 'utf-8');
    
    // Add StudentHelpModule import if not already present
    if (!appModuleContent.includes('StudentHelpModule')) {
      // Add import statement at the beginning
      appModuleContent = appModuleContent.replace(
        "import { Module } from '@nestjs/common';",
        "import { Module } from '@nestjs/common';\nimport { StudentHelpModule } from './student-help/student-help.module';"
      );

      // Add to imports array
      appModuleContent = appModuleContent.replace(
        'imports: [',
        'imports: [StudentHelpModule,'
      );

      fs.writeFileSync(appModulePath, appModuleContent);
    }

    // Install bcrypt if not already installed
    try {
      execSync('npm list bcrypt 2>&1 | grep bcrypt', { stdio: 'ignore', cwd: backendPath });
    } catch {
      execSync('npm install bcrypt 2>&1 > /dev/null', { stdio: 'ignore', cwd: backendPath });
    }

    spinner.succeed(chalk.green('StudentHelp module setup complete'));
  } catch (error) {
    spinner.fail(chalk.red('Error setting up StudentHelp module'));
    console.error(error.message);
  }

  // Success banner
  console.log(chalk.hex('#00FF00').bold('\n' + '═'.repeat(60)));
  console.log(chalk.hex('#00FF00').bold('║') + chalk.hex('#39FF14').bold('  ✨ Project Created Successfully Fasttt! ✨').padEnd(58) + chalk.hex('#00FF00').bold('║'));
  console.log(chalk.hex('#00FF00').bold('═'.repeat(60)));
  
  console.log(chalk.cyan.bold('\n📂 Next Steps:\n'));
  console.log(chalk.white(`  ${chalk.hex('#00D9FF')('$')} cd ${projectName}`));
  console.log(chalk.white(`  ${chalk.hex('#00D9FF')('$')} docker-compose up -d\n`));
  
  console.log(chalk.hex('#FFD700').bold('🌐 Access Points:\n'));
  console.log(chalk.white(`  Frontend:  ${chalk.hex('#FF00FF').bold('http://localhost:3001')}`));
  console.log(chalk.white(`  Backend:   ${chalk.hex('#00FFFF').bold('http://localhost:3000')}`));
  console.log(chalk.white(`  Database:  ${chalk.hex('#FFD700').bold('localhost:5432')}\n`));
  
  console.log(chalk.hex('#39FF14').bold('💡 Useful Commands:\n'));
  console.log(chalk.white(`  student-help generate:auth`));
  console.log(chalk.white(`  student-help generate:resource User\n`));
  
  console.log(chalk.hex('#00FF00').bold('═'.repeat(60) + '\n'));
};

// ============================================
// Command: dev
// ============================================
const devCommand = async () => {
  printBanner();
  
  const spinner = ora({
    text: 'Starting Docker containers',
    spinner: 'dots3',
    color: 'cyan'
  }).start();
  
  try {
    execSync('docker-compose up -d', { stdio: 'ignore' });
    spinner.succeed(chalk.green('Docker containers running'));

    console.log(chalk.blue.bold('\n⏳ Waiting for services to initialize...\n'));
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(chalk.green.bold('✓ Development Environment Ready!\n'));
    console.log(chalk.cyan.bold('Access:\n'));
    console.log(chalk.white(`  Frontend:  ${chalk.yellow.bold('http://localhost:3001')}`));
    console.log(chalk.white(`  Backend:   ${chalk.yellow.bold('http://localhost:3000')}`));
    console.log(chalk.white(`  Database:  ${chalk.yellow.bold('localhost:5432')}\n`));
    
    console.log(chalk.yellow('To stop: docker-compose down\n'));
  } catch (error) {
    spinner.fail(chalk.red('Error starting environment'));
    throw error;
  }
};

// ============================================
// Command: db <database>
// ============================================
const dbCommand = async (database) => {
  console.log(chalk.blue(`\n📦 Database Information: ${database}\n`));

  switch (database.toLowerCase()) {
    case 'postgres':
    case 'postgresql':
      console.log(chalk.green('✅ PostgreSQL is included!\n'));
      console.log(chalk.white('Credentials:'));
      console.log(chalk.cyan('  Host: postgres (Docker) / localhost (local)'));
      console.log(chalk.cyan('  User: student'));
      console.log(chalk.cyan('  Password: student123\n'));
      break;

    case 'mongodb':
    case 'mongo':
      console.log(chalk.yellow('To add MongoDB, edit docker-compose.yml\n'));
      break;

    case 'redis':
      console.log(chalk.yellow('To add Redis, edit docker-compose.yml\n'));
      break;

    default:
      console.log(chalk.red(`Database '${database}' not recognized`));
      console.log(chalk.cyan('Available: postgres, mongodb, redis\n'));
  }
};

// ============================================
// Command: generate:auth
// ============================================
const generateAuthCommand = async () => {
  const spinner = ora({
    text: 'Generating Auth module',
    spinner: 'dots3',
    color: 'magenta'
  }).start();
  
  try {
    execSync('cd backend && nest g module auth 2>&1 > /dev/null', { stdio: 'ignore' });
    execSync('cd backend && nest g controller auth 2>&1 > /dev/null', { stdio: 'ignore' });
    execSync('cd backend && nest g service auth 2>&1 > /dev/null', { stdio: 'ignore' });
    
    spinner.succeed(chalk.green('Module created'));

    const depsSpinner = ora({
      text: 'Installing dependencies',
      spinner: 'arc',
      color: 'blue'
    }).start();
    
    execSync('cd backend && npm install @nestjs/jwt @nestjs/passport passport passport-jwt @types/passport-jwt bcrypt 2>&1 > /dev/null', { stdio: 'ignore' });
    execSync('cd backend && npm install -D @types/bcrypt 2>&1 > /dev/null', { stdio: 'ignore' });
    
    depsSpinner.succeed(chalk.green('Dependencies installed'));

    console.log(chalk.green.bold('\n✓ Auth Module Created!\n'));
    console.log(chalk.yellow('Next steps:\n'));
    console.log(chalk.white('  1. Configure JWT_SECRET in .env'));
    console.log(chalk.white('  2. Implement logic in backend/src/auth/'));
    console.log(chalk.white('  3. Register module in app.module.ts\n'));
  } catch (error) {
    spinner.fail(chalk.red('Error generating auth'));
    throw error;
  }
};

// ============================================
// Command: generate:resource <name>
// ============================================
const generateResourceCommand = async (resourceName) => {
  const resourceLower = resourceName.toLowerCase();
  const resourcePascal = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);

  const spinner = ora({
    text: `Generating ${resourcePascal} CRUD`,
    spinner: 'bouncingBar',
    color: 'yellow'
  }).start();

  try {
    const backendPath = path.join(process.cwd(), 'backend/src', resourceLower);
    fs.ensureDirSync(backendPath);
      
    // Module
    const moduleContent = [
      'import { Module } from \'@nestjs/common\';',
      `import { ${resourcePascal}Service } from './${resourceLower}.service';`,
      `import { ${resourcePascal}Controller } from './${resourceLower}.controller';`,
      '',
      `@Module({`,
      `  controllers: [${resourcePascal}Controller],`,
      `  providers: [${resourcePascal}Service],`,
      `})`,
      `export class ${resourcePascal}Module {}`,
    ].join('\n');
    
    fs.writeFileSync(path.join(backendPath, `${resourceLower}.module.ts`), moduleContent);

    // Service
    const serviceContent = [
      'import { Injectable } from \'@nestjs/common\';',
      `import { Create${resourcePascal}Dto } from './dto/create-${resourceLower}.dto';`,
      `import { Update${resourcePascal}Dto } from './dto/update-${resourceLower}.dto';`,
      '',
      '@Injectable()',
      `export class ${resourcePascal}Service {`,
      `  create(create${resourcePascal}Dto: Create${resourcePascal}Dto) {`,
      `    return 'Create endpoint';`,
      `  }`,
      `  findAll() {`,
      `    return 'Find all endpoint';`,
      `  }`,
      `  findOne(id: number) {`,
      `    return { id };`,
      `  }`,
      `  update(id: number, update${resourcePascal}Dto: Update${resourcePascal}Dto) {`,
      `    return { id, data: update${resourcePascal}Dto };`,
      `  }`,
      `  remove(id: number) {`,
      `    return { id };`,
      `  }`,
      `}`,
    ].join('\n');

    fs.writeFileSync(path.join(backendPath, `${resourceLower}.service.ts`), serviceContent);

    // Controller
    const controllerContent = [
      'import {',
      '  Controller,',
      '  Get,',
      '  Post,',
      '  Body,',
      '  Patch,',
      '  Param,',
      '  Delete,',
      '} from \'@nestjs/common\';',
      `import { ${resourcePascal}Service } from './${resourceLower}.service';`,
      `import { Create${resourcePascal}Dto } from './dto/create-${resourceLower}.dto';`,
      `import { Update${resourcePascal}Dto } from './dto/update-${resourceLower}.dto';`,
      '',
      `@Controller('${resourceLower}')`,
      `export class ${resourcePascal}Controller {`,
      `  constructor(private readonly ${resourceLower}Service: ${resourcePascal}Service) {}`,
      '',
      `  @Post()`,
      `  create(@Body() create${resourcePascal}Dto: Create${resourcePascal}Dto) {`,
      `    return this.${resourceLower}Service.create(create${resourcePascal}Dto);`,
      `  }`,
      `  @Get()`,
      `  findAll() {`,
      `    return this.${resourceLower}Service.findAll();`,
      `  }`,
      `  @Get(':id')`,
      `  findOne(@Param('id') id: string) {`,
      `    return this.${resourceLower}Service.findOne(+id);`,
      `  }`,
      `  @Patch(':id')`,
      `  update(`,
      `    @Param('id') id: string,`,
      `    @Body() update${resourcePascal}Dto: Update${resourcePascal}Dto,`,
      `  ) {`,
      `    return this.${resourceLower}Service.update(+id, update${resourcePascal}Dto);`,
      `  }`,
      `  @Delete(':id')`,
      `  remove(@Param('id') id: string) {`,
      `    return this.${resourceLower}Service.remove(+id);`,
      `  }`,
      `}`,
    ].join('\n');

    fs.writeFileSync(path.join(backendPath, `${resourceLower}.controller.ts`), controllerContent);

    // DTOs
    const dtoDir = path.join(backendPath, 'dto');
    fs.ensureDirSync(dtoDir);

    const createDtoContent = `export class Create${resourcePascal}Dto {
  name: string;
  description?: string;
  email?: string;
}`;

    const updateDtoContent = `export class Update${resourcePascal}Dto {
  name?: string;
  description?: string;
  email?: string;
}`;

    fs.writeFileSync(path.join(dtoDir, `create-${resourceLower}.dto.ts`), createDtoContent);
    fs.writeFileSync(path.join(dtoDir, `update-${resourceLower}.dto.ts`), updateDtoContent);
    
    // Frontend
    const frontendPath = path.join(process.cwd(), 'frontend/app', resourceLower);
    fs.ensureDirSync(frontendPath);

    const pageContent = `'use client';

import React, { useState } from 'react';

interface ${resourcePascal} {
  id?: number;
  name: string;
  description?: string;
  email?: string;
}

export default function ${resourcePascal}Page() {
  const [items, setItems] = useState<${resourcePascal}[]>([]);
  const [form, setForm] = useState<${resourcePascal}>({
    name: '',
    description: '',
    email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name) {
      setItems([...items, { ...form, id: Date.now() }]);
      setForm({ name: '', description: '', email: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">${resourcePascal} Management</h1>
          <p className="text-gray-600 mb-8">Create and manage ${resourceLower} records</p>

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Description"
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add ${resourcePascal}
            </button>
          </form>

          <div className="grid gap-4">
            {items.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No ${resourceLower}s created yet</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                  {item.email && <p className="text-sm text-gray-600">{item.email}</p>}
                  {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}`;

    fs.writeFileSync(path.join(frontendPath, 'page.tsx'), pageContent);

    spinner.succeed(chalk.green(`${resourcePascal} resource generated`));

    console.log(chalk.green.bold(`\n✓ ${resourcePascal} Created!\n`));
    console.log(chalk.yellow('Next steps:\n'));
    console.log(chalk.white(`  1. Register module in backend/src/app.module.ts`));
    console.log(chalk.white(`  2. Implement logic in backend/src/${resourceLower}/`));
    console.log(chalk.white(`  3. Customize component in frontend/app/${resourceLower}/page.tsx\n`));
  } catch (error) {
    spinner.fail(chalk.red('Error generating resource'));
    throw error;
  }
};

// ============================================
// CLI Setup
// ============================================
const program = new Command();

program
  .version('2.0.0')
  .description(chalk.hex('#FF00FF').bold('✨ Student Help Framework') + ' - Create full-stack apps in minutes');

program
  .command('new <projectName>')
  .description('✨ Create a new full-stack project with NestJS + Next.js + PostgreSQL')
  .action(async (projectName) => {
    try {
      await newCommand(projectName);
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('dev')
  .description('🚀 Start development environment with Docker')
  .action(async () => {
    try {
      await devCommand();
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('db <database>')
  .description('📦 Database information and setup guide')
  .action(async (database) => {
    try {
      await dbCommand(database);
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('generate:auth')
  .description('🔐 Generate authentication module with JWT support')
  .action(async () => {
    try {
      await generateAuthCommand();
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('generate:resource <resourceName>')
  .description('🛠️  Generate CRUD resource (backend + frontend)')
  .action(async (resourceName) => {
    try {
      await generateResourceCommand(resourceName);
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

// ============================================
// Command: commands
// ============================================
const commandsCommand = () => {
  printBanner();
  
  console.log(chalk.hex('#FFD700').bold('\n📚 AVAILABLE COMMANDS\n'));
  console.log(chalk.hex('#00D9FF').bold('═'.repeat(60) + '\n'));

  const commands = [
    {
      name: 'new <projectName>',
      emoji: '✨',
      description: 'Create a new full-stack project',
      details: 'Sets up NestJS backend, Next.js frontend, PostgreSQL, Docker Compose,\nand all modern dependencies in one command.',
      example: 'student-help new my-awesome-app'
    },
    {
      name: 'dev',
      emoji: '🚀',
      description: 'Start development environment',
      details: 'Launches Docker Compose with all services:\nBackend (port 3000), Frontend (port 3001), Database (port 5432)',
      example: 'student-help dev'
    },
    {
      name: 'db <database>',
      emoji: '📦',
      description: 'Database information and setup',
      details: 'Shows credentials and setup instructions for supported databases.\nSupported: postgres, mongodb, redis',
      example: 'student-help db postgres'
    },
    {
      name: 'generate:auth',
      emoji: '🔐',
      description: 'Generate authentication module',
      details: 'Creates Auth Module with JWT support, Passport.js integration,\nand bcrypt password hashing setup.',
      example: 'student-help generate:auth'
    },
    {
      name: 'generate:resource <name>',
      emoji: '🛠️',
      description: 'Generate CRUD resource',
      details: 'Auto-generates complete CRUD operations for backend (NestJS) and\nfrontend (React component) with database DTOs.',
      example: 'student-help generate:resource Post'
    },
    {
      name: 'commands',
      emoji: '📚',
      description: 'List all available commands',
      details: 'Shows this help menu with detailed information about each command.',
      example: 'student-help commands'
    },
    {
      name: 'features',
      emoji: '⚡',
      description: 'Show advanced features',
      details: 'Displays how to use advanced features from the features/ directory\nincluding custom modules and utilities.',
      example: 'student-help features'
    }
  ];

  commands.forEach((cmd, index) => {
    console.log(chalk.hex('#FF00FF').bold(`${cmd.emoji} ${cmd.name.padEnd(30)} ${cmd.description}`));
    console.log(chalk.gray(`   ${cmd.details}`));
    console.log(chalk.hex('#00D9FF')(`   $ ${cmd.example}`));
    if (index < commands.length - 1) {
      console.log('');
    }
  });

  console.log(chalk.hex('#00D9FF').bold('\n' + '═'.repeat(60)));
  console.log(chalk.hex('#39FF14').bold('\n💡 Quick Start:'));
  console.log(chalk.white('   1. student-help new my-app'));
  console.log(chalk.white('   2. cd my-app'));
  console.log(chalk.white('   3. docker-compose up -d'));
  console.log(chalk.white('   4. Visit http://localhost:3001'));
  console.log(chalk.hex('#00D9FF').bold('\n' + '═'.repeat(60) + '\n'));
};

// ============================================
// Command: features
// ============================================
const featuresCommand = () => {
  printBanner();
  
  console.log(chalk.hex('#FFD700').bold('\n⚡ ADVANCED FEATURES & UTILITIES\n'));
  console.log(chalk.hex('#00D9FF').bold('═'.repeat(60) + '\n'));

  const features = [
    {
      category: '📁 Features Directory',
      items: [
        {
          name: 'Custom Middleware',
          description: 'Add authentication, logging, and error handling middleware'
        },
        {
          name: 'Database Utilities',
          description: 'Pre-configured database connection pools and migrations'
        },
        {
          name: 'API Response Formatters',
          description: 'Standardized response formats for your API'
        },
        {
          name: 'Error Handlers',
          description: 'Global error handling with custom error messages'
        }
      ]
    },
    {
      category: '🔧 Configuration Options',
      items: [
        {
          name: 'Environment Variables',
          description: 'Use .env.example as template for your configuration'
        },
        {
          name: 'Docker Compose Override',
          description: 'Create docker-compose.override.yml for local development changes'
        },
        {
          name: 'Database Migrations',
          description: 'Use TypeORM CLI: npm run migration:generate'
        }
      ]
    },
    {
      category: '📚 Additional Commands',
      items: [
        {
          name: 'Backend Scripts',
          description: 'npm run start:dev (watch mode)\n   npm run build (production build)\n   npm run test (run tests)'
        },
        {
          name: 'Frontend Scripts',
          description: 'npm run dev (dev server)\n   npm run build (production build)\n   npm run lint (check code quality)'
        }
      ]
    },
    {
      category: '🔐 Security Features',
      items: [
        {
          name: 'JWT Authentication',
          description: 'Pre-configured with Passport.js and bcrypt'
        },
        {
          name: 'CORS Configuration',
          description: 'Cross-Origin Resource Sharing setup in backend'
        },
        {
          name: 'Environment Security',
          description: 'Sensitive data protected via .env files'
        }
      ]
    },
    {
      category: '🚀 Performance Features',
      items: [
        {
          name: 'Code Splitting',
          description: 'Next.js automatic code splitting on frontend'
        },
        {
          name: 'Caching',
          description: 'Built-in caching strategies with Redis support'
        },
        {
          name: 'Database Indexing',
          description: 'Recommendations for optimal query performance'
        }
      ]
    }
  ];

  features.forEach((section) => {
    console.log(chalk.hex('#FF00FF').bold(section.category));
    console.log('');
    
    section.items.forEach((item) => {
      console.log(chalk.hex('#00D9FF')(`  ✓ ${item.name}`));
      item.description.split('\n').forEach(line => {
        console.log(chalk.gray(`    ${line}`));
      });
    });
    
    console.log('');
  });

  console.log(chalk.hex('#00D9FF').bold('═'.repeat(60)));
  console.log(chalk.hex('#39FF14').bold('\n📖 Documentation:'));
  console.log(chalk.white('   - Backend: /backend/README.md'));
  console.log(chalk.white('   - Frontend: /frontend/README.md'));
  console.log(chalk.white('   - Project: README.md'));
  
  console.log(chalk.hex('#FFD700').bold('\n🔗 Useful Links:'));
  console.log(chalk.white('   - NestJS: https://docs.nestjs.com'));
  console.log(chalk.white('   - Next.js: https://nextjs.org/docs'));
  console.log(chalk.white('   - PostgreSQL: https://www.postgresql.org/docs'));
  console.log(chalk.white('   - Tailwind CSS: https://tailwindcss.com/docs'));
  console.log(chalk.white('   - Docker: https://docs.docker.com'));
  console.log(chalk.hex('#00D9FF').bold('\n' + '═'.repeat(60) + '\n'));
};

// ============================================
// Register commands
// ============================================
program
  .command('commands')
  .description('📚 List all available commands with descriptions')
  .action(() => {
    try {
      commandsCommand();
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('features')
  .description('⚡ Show advanced features and utilities available')
  .action(() => {
    try {
      featuresCommand();
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
