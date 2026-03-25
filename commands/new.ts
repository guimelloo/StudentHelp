import fs from 'fs-extra';
import { execSync } from 'child_process';
import path from 'path';

export async function newCommand(projectName) {
  const projectPath = path.join(process.cwd(), projectName);
  fs.ensureDirSync(projectPath);

  console.log("📦 Setting up NestJS backend...");
  try {
    execSync(`npx @nestjs/cli new backend --directory ${projectPath}/backend --package-manager npm`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Error creating backend:', error.message);
    throw error;
  }

  console.log("📦 Setting up Next.js frontend...");
  try {
    execSync(`npx create-next-app@latest ${projectPath}/frontend --typescript --use-npm --eslint --app --no-src-dir --import-alias '@/*'`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Error creating frontend:', error.message);
    throw error;
  }

  console.log("📝 Creating Dockerfiles...");
  fs.writeFileSync(path.join(projectPath, 'backend/Dockerfile'), `FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "start:prod"]
`);

  fs.writeFileSync(path.join(projectPath, 'frontend/Dockerfile'), `FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "start"]
`);

  console.log("📝 Creating docker-compose.yml...");
  fs.writeFileSync(path.join(projectPath, 'docker-compose.yml'), `version: '3.8'
services:
  backend:
    build: ./backend
    container_name: ${projectName}_backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: student
      DB_PASSWORD: student123
      DB_NAME: ${projectName}
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - db
    networks:
      - app-network

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

  db:
    image: postgres:15-alpine
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

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
`);

  console.log("📝 Creating .env.example...");
  fs.writeFileSync(path.join(projectPath, '.env.example'), `# Backend
BACKEND_PORT=3000
NODE_ENV=development

# Frontend
FRONTEND_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Database
DB_HOST=db
DB_PORT=5432
DB_USER=student
DB_PASSWORD=student123
DB_NAME=${projectName}

# JWT
JWT_SECRET=your_secret_key_change_this
JWT_EXPIRATION=7d
`);

  console.log("📝 Creating .gitignore...");
  fs.writeFileSync(path.join(projectPath, '.gitignore'), `# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist
/out

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# IDE
.vscode
.idea
*.swp
*.swo

# Docker
docker-compose.override.yml
`);

  console.log("🔧 Initializing git...");
  try {
    execSync(`cd ${projectPath} && git init && git add . && git commit -m "Initial project setup"`, { stdio: 'inherit' });
  } catch (error) {
    console.warn('Warning: Git not configured properly');
  }

  console.log("\n✅ Project created successfully!");
  console.log(`\n📂 Next steps:`);
  console.log(`   cd ${projectName}`);
  console.log(`   docker-compose up -d`);
  console.log(`\n🚀 Project will be available at:`);
  console.log(`   Backend:  http://localhost:3000`);
  console.log(`   Frontend: http://localhost:3001`);
}