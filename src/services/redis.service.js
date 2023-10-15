import { createClient } from 'redis';

const env = env.process

const client = createClient({
    password: env.REDIS_LABS_PASSWORD,
    socket: {
        host: env.REDIS_LABS_HOST,
        port: env.REDIS_LABS_PORT
    }
});