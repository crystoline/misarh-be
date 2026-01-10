import { createClient } from 'redis';

let redisClient: any = null;

export const connectRedis = async (): Promise<any> => {
  if (redisClient) {
    return redisClient;
  }

  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6399'),
    },
  });

  client.on('error', (err: Error) => console.error('❌ Redis Client Error:', err));
  client.on('connect', () => console.log('✅ Connected to Redis'));

  await client.connect();
  redisClient = client;
  return client;
};

export const getRedisClient = (): any => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    console.log('🔌 Redis connection closed');
  }
};

export default { connectRedis, getRedisClient, closeRedis };
