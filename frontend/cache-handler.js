
const fs = require('fs');
const path = require('path');
const { mkdir } = require('fs/promises');

const memoryCache = new Map();
const CACHE_DIR = path.join(process.cwd(), '.next/cache/incremental');
const MEMORY_CACHE_SIZE = 100; // Limit memory cache size

class FileSystemCache {
  constructor() {
    if (!fs.existsSync(CACHE_DIR)) {
      mkdir(CACHE_DIR, { recursive: true }).catch(console.error);
    }
  }

  async get(key) {
    if (memoryCache.has(key)) {
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
        
        return { 
          value: result.value, 
          lastModified: new Date(result.lastModified) 
        };
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
    }
    return null;
  }

  async set(key, data, options = {}) {
    if (memoryCache.size < MEMORY_CACHE_SIZE) {
      memoryCache.set(key, { 
        value: data, 
        lastModified: new Date() 
      });
    }

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
}

module.exports = FileSystemCache;
