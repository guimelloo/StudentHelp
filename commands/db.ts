import chalk from 'chalk';

export async function dbInstall(feature: string) {
  console.log(chalk.blue(`\n📦 Installing ${feature} database via Docker...\n`));

  switch (feature.toLowerCase()) {
    case 'postgres':
    case 'postgresql':
      console.log(chalk.green('✅ PostgreSQL is already included in docker-compose.yml'));
      console.log(chalk.cyan('Access: localhost:5432'));
      console.log(chalk.cyan('User: student'));
      console.log(chalk.cyan('Password: student123\n'));
      break;

    case 'mongodb':
    case 'mongo':
      console.log(chalk.yellow('⚠️  To add MongoDB, edit docker-compose.yml\n'));
      console.log(chalk.gray(`
services:
  mongodb:
    image: mongo:latest
    container_name: project_mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
      
volumes:
  mongodb_data:
      `));
      break;

    case 'redis':
      console.log(chalk.yellow('⚠️  To add Redis, edit docker-compose.yml\n'));
      console.log(chalk.gray(`
services:
  redis:
    image: redis:alpine
    container_name: project_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      
volumes:
  redis_data:
      `));
      break;

    default:
      console.log(chalk.red(`❌ Database '${feature}' not recognized`));
      console.log(chalk.cyan('Available options: postgres, mongodb, redis\n'));
  }

  console.log(chalk.yellow('Then, run: docker-compose up -d\n'));
}