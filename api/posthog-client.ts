import axios from 'axios';
import * as dotenv from 'dotenv';
import { PostHogEvent } from './datatypes';

dotenv.config({ path: '.env.local' });

class PrivatePostHogClient {
  private apiKey: string | undefined;
  private host: string;
  public enabled: boolean;

  constructor() {
    this.apiKey = process.env.PRIVATE_POSTHOG_KEY;
    this.host = process.env.PRIVATE_POSTHOG_DOMAIN || 'https://us.i.posthog.com';
    
    if (this.apiKey) {
      this.enabled = true;
    } else {
      console.log("Warning: PRIVATE_POSTHOG_KEY not set. PostHog private events will not be sent.");
      this.enabled = false;
    }
  }

  async capture(
    event: string, 
    distinctId: string, 
    properties?: Record<string, any>, 
    timestamp?: string
  ): Promise<void> {
    /**
     * Capture a PostHog event using the private API.
     * 
     * Args:
     *   event: The event name
     *   distinctId: The user ID
     *   properties: Optional event properties
     *   timestamp: Optional timestamp in ISO 8601 format
     */
    if (!this.enabled) {
      console.log(`PostHog private disabled - would send event: ${event} for user: ${distinctId}`);
      if (properties) {
        console.log(`Properties: ${JSON.stringify(properties)}`);
      }
      return;
    }

    try {
      const url = `${this.host}/i/v0/e/`;
      const headers = {
        "Content-Type": "application/json"
      };

      const payload: any = {
        api_key: this.apiKey,
        event: event,
        distinct_id: distinctId,
        properties: properties || {}
      };

      if (timestamp) {
        payload.timestamp = timestamp;
      }

      const response = await axios.post(url, payload, { headers });
      console.log(`PostHog private event sent: ${event} for user: ${distinctId}`);
    } catch (error) {
      console.error(`Error sending PostHog private event: ${error}`);
    }
  }
}

// Create global instance
const posthogPrivateClient = new PrivatePostHogClient();

export async function capturePrivateEvent(
  event: string, 
  distinctId: string, 
  properties?: Record<string, any>, 
  timestamp?: string
): Promise<void> {
  /**
   * Capture a PostHog event using the private API.
   * This is a convenience function that uses the global posthogPrivateClient instance.
   */
  await posthogPrivateClient.capture(event, distinctId, properties, timestamp);
}

export async function fetchEvents(
  eventName?: string, 
  after?: string, 
  before?: string, 
  limit: number = 100
): Promise<any> {
  /**
   * Fetch events from PostHog using the private API.
   * Args:
   *   eventName: Filter by event name (optional)
   *   after: ISO date string for filtering events after this date (optional)
   *   before: ISO date string for filtering events before this date (optional)
   *   limit: Max number of events to fetch (default 100)
   * Returns:
   *   JSON response from PostHog API
   */
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const host = process.env.PRIVATE_POSTHOG_DOMAIN || 'https://us.posthog.com';

  console.log(`Environment check - personalApiKey: ${personalApiKey ? 'set' : 'NOT SET'}`);
  console.log(`Environment check - projectId: ${projectId ? 'set' : 'NOT SET'}`);
  console.log(`Environment check - host: ${host}`);

  if (!personalApiKey) {
    throw new Error('POSTHOG_PERSONAL_API_KEY environment variable is not set');
  }
  if (!projectId) {
    throw new Error('POSTHOG_PROJECT_ID environment variable is not set');
  }

  const url = `${host}/api/projects/${projectId}/events/`;
  const headers = {
    "Authorization": `Bearer ${personalApiKey}`,
    "Content-Type": "application/json"
  };
  
  const params: Record<string, any> = {
    limit: limit,
    format: "json"
  };
  
  if (eventName) {
    params.event = eventName;
  }
  if (after) {
    params.after = after;
  }
  if (before) {
    params.before = before;
  }

  console.log(`Making request to: ${url}`);
  console.log(`With params: ${JSON.stringify(params)}`);

  try {
    const response = await axios.get(url, { headers, params });
    console.log(`Response status: ${response.status}`);

    if (response.status !== 200) {
      console.log(`Response text: ${response.data}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching events: ${error}`);
    throw error;
  }
} 