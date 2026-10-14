import { ZombieLiveServer } from './server.js';
import { config } from './config.js';

async function bootstrap() {
  try {
    const server = new ZombieLiveServer();
    await server.init();
    await server.listen(config.port, config.host);
  } catch (err) {
    console.error('Falha fatal ao iniciar Zombie Live Server:', err);
    process.exit(1);
  }
}

bootstrap();
