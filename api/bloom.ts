import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BloomApp } from './datatypes';
import { addApp } from './database-client';
import { OLD_PIPELINE } from './settings';

export function createBloomAppFromChatMessage(
  message: string, 
  dbClient: any, 
  pipeline: string = OLD_PIPELINE
): BloomApp[] {
  /**
   * Simulates creating a BloomApp from a chat message and pipeline.
   * Picks a random image from the pipeline folder, assigns a UUID, and stores it in the in-memory database.
   * Returns a base64 data URL for the image (not a file path).
   */
  
  // Find the pipeline folder - back to same directory level
  const resourceDir = path.join(__dirname, "resroucre", pipeline);
  const items = fs.readdirSync(resourceDir);
  const images = items.filter(f => f.endsWith('.png'));
  
  if (images.length === 0) {
    throw new Error(`No images found for pipeline: ${pipeline}`);
  }
  
  const chosenImage = images[Math.floor(Math.random() * images.length)];
  const imagePath = path.join(resourceDir, chosenImage);

  // Read and encode the image as base64 data URL
  const imageBytes = fs.readFileSync(imagePath);
  const encodedImage = imageBytes.toString('base64');
  const imageDataUrl = `data:image/png;base64,${encodedImage}`;

  // Generate a UUID for the app/image ID
  const appId = uuidv4();

  // Store in the in-memory database
  const app: BloomApp = {
    id: appId,
    image: imageDataUrl, // Return the data URL, not the file path
    origin_pipeline: pipeline,
    message: message
  };
  
  addApp(app);

  // Return the new app in a list (to match previous return type)
  return [app];
} 