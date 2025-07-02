import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { BloomApp } from './datatypes';

// Simulating a real database in memory with kv
const storage: Record<string, any> = {};

// Simulated in-memory database for bloom apps
const appsDb: Record<string, BloomApp> = {};

export function create(key: string, value: any): void {
  storage[key] = value;
}

export function read(query: string | string[] | Record<string, any>): any | Record<string, any> | null {
  /**
   * Read from storage using various query types.
   * 
   * Args:
   *   query: Can be:
   *     - Single key (string)
   *     - List of keys (string[]) 
   *     - Dict query (Record<string, any>) - filters results based on key-value pairs
   *     
   * Returns:
   *   If single key: the value or null if not found
   *   If multiple keys: dict mapping keys to values (null for missing keys)
   *   If dict query: filtered results matching the query criteria
   */
  if (typeof query === 'string') {
    return storage[query] || null;
  } else if (Array.isArray(query)) {
    const result: Record<string, any> = {};
    for (const key of query) {
      result[key] = storage[key] || null;
    }
    return result;
  } else if (typeof query === 'object' && query !== null) {
    // Handle dict queries - filter storage based on key-value pairs
    const results: Record<string, any> = {};
    for (const [key, value] of Object.entries(storage)) {
      if (typeof value === 'object' && value !== null) {
        // Check if all query conditions match
        let matches = true;
        for (const [queryKey, queryValue] of Object.entries(query)) {
          if (!(queryKey in value) || value[queryKey] !== queryValue) {
            matches = false;
            break;
          }
        }
        if (matches) {
          results[key] = value;
        }
      }
    }
    return results;
  } else {
    throw new TypeError("query must be a string, array of strings, or object");
  }
}

export function update(key: string, value: any): boolean {
  if (key in storage) {
    storage[key] = value;
    return true;
  }
  return false;
}

export function deleteKey(key: string): boolean {
  if (key in storage) {
    delete storage[key];
    return true;
  }
  return false;
}

export function init(): void {
  /**
   * Initialize the database with bloom apps from the resource directory.
   * 
   * Database Schema:
   * storage = {
   *   "bloom_apps": {
   *     "image_hash": {
   *       "id": string,           // SHA256 hash of the image
   *       "image": string,        // Base64 encoded image data URL
   *       "origin_pipeline": string  // Pipeline name (subfolder name)
   *     }
   *   },
   *   "pipeline_ids": string[]    // List of unique pipeline names
   * }
   */
  const resourceDir = path.join(__dirname, "resroucre");
  if (!fs.existsSync(resourceDir)) {
    throw new Error(`Resource directory does not exist: ${resourceDir}`);
  }

  // Initialize pipeline_ids list
  const pipelineIds: string[] = [];
  
  function walkDir(dir: string): void {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        walkDir(itemPath);
      } else if (stat.isFile()) {
        // Get the immediate subfolder name as the pipeline
        const relPath = path.relative(resourceDir, itemPath);
        const parts = relPath.split(path.sep);
        const originPipeline = parts[0] || "unknown";
        
        // Add pipeline to pipeline_ids if not already present
        if (!pipelineIds.includes(originPipeline)) {
          pipelineIds.push(originPipeline);
        }
        
        const imageBytes = fs.readFileSync(itemPath);
        const imageHash = crypto.createHash('sha256').update(imageBytes).digest('hex');
        const encodedImage = imageBytes.toString('base64');
        
        const app: BloomApp = {
          id: imageHash,
          image: `data:image/png;base64,${encodedImage}`,
          origin_pipeline: originPipeline
        };
        
        if (!storage["bloom_apps"]) {
          storage["bloom_apps"] = {};
        }
        storage["bloom_apps"][imageHash] = app;
        console.log(`Loaded app: ${item} (id: ${imageHash}, pipeline: ${originPipeline})`);
      }
    }
  }
  
  walkDir(resourceDir);
  
  // Store pipeline_ids in storage
  storage["pipeline_ids"] = pipelineIds;
  console.log(`Found pipelines: ${pipelineIds}`);
}

export function addApp(app: BloomApp): void {
  appsDb[app.id] = app;
}

export function readApps(): Record<string, BloomApp> {
  return appsDb;
}

// Initialize the database when the module is loaded
init(); 