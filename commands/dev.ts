import { execSync } from 'child_process';
import path from 'path';
import chalk from 'chalk';

export async function devCommand() {
  try {
    console.log(chalk.blue.bold('\n🐳 Starting Docker containers...\n'));
    execSync('docker-compose up -d', { stdio: 'inherit' });

    console.log(chalk.blue.bold('\n⏳ Waiting for containers to initialize...\n'));
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(chalk.green.bold('\n✅ Development environment started!\n'));
    console.log(chalk.cyan('Backend:  http://localhost:3000'));
    console.log(chalk.cyan('Frontend: http://localhost:3001'));
    console.log(chalk.cyan('Database: localhost:5432\n'));
    
    console.log(chalk.yellow('To stop the environment, run: docker-compose down\n'));
  } catch (error) {
    console.error(chalk.red('Error starting environment:'), error instanceof Error ? error.message : String(error));
    throw error;
  }
}