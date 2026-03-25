import { execSync } from 'child_process';
import chalk from 'chalk';

export async function generateAuth() {
  console.log(chalk.blue.bold('\n🔐 Creating Auth module...\n'));
  
  try {
    console.log(chalk.cyan('Backend:'));
    console.log('  - Creating module...');
    execSync('cd backend && nest g module auth', { stdio: 'inherit' });
    
    console.log('  - Creating controller...');
    execSync('cd backend && nest g controller auth', { stdio: 'inherit' });
    
    console.log('  - Creating service...');
    execSync('cd backend && nest g service auth', { stdio: 'inherit' });

    console.log(chalk.cyan('\nInstalling authentication dependencies...'));
    execSync('cd backend && npm install @nestjs/jwt @nestjs/passport passport passport-jwt @types/passport-jwt bcrypt --save', { stdio: 'inherit' });
    execSync('cd backend && npm install -D @types/bcrypt', { stdio: 'inherit' });

    console.log(chalk.green('\n✅ Auth module created successfully!\n'));
    console.log(chalk.yellow('Next steps:'));
    console.log('  1. Configure JWT variables in .env');
    console.log('  2. Implement authentication logic in AuthService');
    console.log('  3. Configure passport strategies in auth.strategy.ts\n');
  } catch (error) {
    console.error(chalk.red('Error generating auth:'), error instanceof Error ? error.message : String(error));
    throw error;
  }
}