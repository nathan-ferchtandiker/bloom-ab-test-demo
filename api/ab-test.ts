import { createBloomAppFromChatMessage } from './bloom';
import { OLD_PIPELINE, NEW_PIPELINE } from './settings';
import { BloomApp } from './datatypes';

export function isAbTest(data: any): boolean {
  /**
   * Determines if the request should be an A/B test.
   * Currently returns 50% chance, but can be extended with more sophisticated logic.
   */
  return Math.random() < 0.5;
}

export function getAbTestApps(data: any, dbClient: any): BloomApp[] {
  /**
   * Returns 2 random apps from different pipelines for A/B testing.
   * Falls back to creating a single app if not enough apps are available.
   */
  
  // Get one app from each of two different pipelines
  const selectedPipelines = [OLD_PIPELINE, NEW_PIPELINE];
  const createdBloomApps: BloomApp[] = [];
  
  for (const pipeline of selectedPipelines) {
    // Fallback: create a new app using bloom
    const app = createBloomAppFromChatMessage(data.message || "", dbClient, pipeline);
    createdBloomApps.push(...app);
  }
  
  // Shuffle the apps to randomize the order for A/B testing
  for (let i = createdBloomApps.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [createdBloomApps[i], createdBloomApps[j]] = [createdBloomApps[j], createdBloomApps[i]];
  }
  
  return createdBloomApps;
} 