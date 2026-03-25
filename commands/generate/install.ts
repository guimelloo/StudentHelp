import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

export async function installDependencies() {
  const currentDir = process.cwd();

  console.log("📦 Installing backend dependencies...");
  try {
    execSync('cd backend && npm install', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error installing backend dependencies:', error.message);
  }

  console.log("📦 Installing frontend dependencies...");
  try {
    execSync('cd frontend && npm install', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error installing frontend dependencies:', error.message);
  }

  console.log("✅ Dependencies installed successfully!");
}

export async function setupEnvironment() {
  const envPath = '.env';
  const envExamplePath = '.env.example';

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log("📝 Creating .env file...");
    fs.copyFileSync(envExamplePath, envPath);
    console.log("✅ .env file created from .env.example");
  }
}
