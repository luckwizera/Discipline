import 'dotenv/config';
import { app } from './app.js';
import { logger } from './logger.js';

const port = Number(process.env.PORT || 3000);
app.listen(port, () => logger.info('Discipline Track server started', { port, environment: process.env.NODE_ENV || 'development' }));
