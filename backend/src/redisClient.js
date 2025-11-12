const { createClient } = require('redis');
require('dotenv').config();

let client = null;
const fallback=new Map();
async function connect() {
  const url =process.env.REDIS_URL && process.env.REDIS_URL.trim();
  if (!url) {
    console.log('No REDIS_URL; using in-memory cache fallback');
    return;
  }
  try {
    client =createClient({
      url,
      socket: { tls: true, rejectUnauthorized: false }
    });
    client.on('error', (e) => console.error('Redis error', e && e.message));
    await client.connect();
    console.log( 'Connected to Redis');
  } catch (e) {
    console.warn( 'Could not connect to Redis; falling back. Err:', e.message);
    client = null;
  }
}
async function get(key) {
  if (client) {
    try { return await client.get(key); } catch (e) { console.warn('redis get failed', e.message); return null; }
  }
  const it = fallback.get(key);
  if (!it) return null;
  if (Date.now() > it.expire) { fallback.delete(key); return null; }
  return it.value;
}
async function setEx(key, seconds, value) {
  const v = typeof value ==='string' ? value : JSON.stringify(value);
  if (client) {
    try { await client.setEx(key, seconds, v); return; } catch (e) {console.warn('redis setEx failed', e.message); }
  }
  fallback.set(key,{ value: v, expire: Date.now() + seconds * 1000 });
}
async function del(key) {
  if (client) {
    try { await client.del(key); return; } catch (e) { console.warn('redis del failed', e.message); }
  }
  fallback.delete(key);
}
module.exports = { connect, get, setEx, del, redisClient: client };
