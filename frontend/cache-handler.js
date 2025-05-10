
const fs = require('fs');
const path = require('path');
const { mkdir } = require('fs/promises');

const memoryCache = new Map();
const CACHE_DIR = path.join(process.cwd(), '.next/cache/incremental');
const MEMORY_CACHE_SIZE = 200; // Increased memory cache size for better performance
const CACHE_EXPIRY = 3600000; // Cache expiry in milliseconds (1 hour)

let cacheHits = 0;
let cacheMisses = 0;

class FileSystemCache {
  constructor() {
    if (!fs.existsSync(CACHE_DIR)) {
      mkdir(CACHE_DIR, { recursive: true }).catch(console.error);
    }
    
    console.log(`Cache initialized at ${CACHE_DIR}`);
    
    this.cleanupCache().catch(console.error);
  }

  async cleanupCache() {
    try {
      if (fs.existsSync(CACHE_DIR)) {
        const files = fs.readdirSync(CACHE_DIR);
        const now = new Date().getTime();
        
        for (const file of files) {
          const filePath = path.join(CACHE_DIR, file);
          const stats = fs.statSync(filePath);
          if (now - stats.mtime.getTime() > CACHE_EXPIRY) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  async get(key) {
    if (memoryCache.has(key)) {
      cacheHits++;
      return memoryCache.get(key);
    }

    const filePath = this.getFilePath(key);
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const result = JSON.parse(data);
        
        if (memoryCache.size < MEMORY_CACHE_SIZE) {
          memoryCache.set(key, { 
            value: result.value, 
            lastModified: new Date(result.lastModified) 
          });
        }
        
        cacheHits++;
        return { 
          value: result.value, 
          lastModified: new Date(result.lastModified) 
        };
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
    }
    
    cacheMisses++;
    return null;
  }

  async set(key, data, options = {}) {
    if (memoryCache.size >= MEMORY_CACHE_SIZE) {
      const oldestKey = memoryCache.keys().next().value;
      memoryCache.delete(oldestKey);
    }
    
    memoryCache.set(key, { 
      value: data, 
      lastModified: new Date() 
    });

    const filePath = this.getFilePath(key);
    try {
      const cacheData = {
        value: data,
        lastModified: new Date().toISOString(),
        tags: options.tags || [],
      };
      
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(cacheData), 'utf8');
      return true;
    } catch (error) {
      console.error('Error writing to cache:', error);
      return false;
    }
  }

  getFilePath(key) {
    const safeKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
    return path.join(CACHE_DIR, `${safeKey}.json`);
  }
  
  async revalidateTag() {
    return true;
  }
  
  async resetRequestCache() {
    return true;
  }
}

module.exports = FileSystemCache;
