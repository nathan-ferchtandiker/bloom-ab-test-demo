import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { createBloomAppFromChatMessage } from './bloom';
import { isAbTest, getAbTestApps } from './ab-test';
import { capturePrivateEvent, fetchEvents } from './posthog-client';
import { ChatRequest, AppSelectionRequest } from './datatypes';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = parseInt(process.env.PORT || '5328', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.post("/api/app", (req, res) => {
  const data: ChatRequest = req.body;
  const chatMessage = data.message;
  console.log("Received message:", data.message);
  
  const isAbTestResult = isAbTest(data);
  
  // Use ab_test module to handle A/B test logic
  let publicApps;
  if (isAbTestResult) {
    publicApps = getAbTestApps(data, null);
  } else {
    publicApps = createBloomAppFromChatMessage(chatMessage, null);
  }
  
  res.json({ apps: publicApps });
});

app.post("/api/app/selection", async (req, res) => {
  const data: AppSelectionRequest = req.body;
  const selectedId = data.selected_id;
  const choices: string[] = data.choices; // list of app ids
  const appSelections = data.app_selections; // list of dicts with app_id and is_selected
  const userId = data.user_id; // optional, if you want to track user

  // For demonstration, just print the event. In production, store in DB or log.
  console.log(`User selected app: ${selectedId} from choices: ${choices} (user_id: ${userId})`);
  if (appSelections) {
    console.log("App selection details:");
    for (const appSelection of appSelections) {
      const appId = appSelection.app_id;
      const isSelected = appSelection.is_selected;
      const status = isSelected ? "SELECTED" : "NOT SELECTED";
      console.log(`  - App ${appId}: ${status}`);
    }
  }

  // Send PostHog event (now using bloom-app-select)
  const eventProperties = {
    selected_app_id: selectedId,
    total_choices: choices.length,
    choices: choices,
    app_selections: appSelections
  };
  try {
    await capturePrivateEvent(
      "bloom-app-select",
      userId || "anonymous",
      eventProperties
    );
  } catch (error) {
    console.error("Error capturing PostHog event:", error);
  }
  res.json({ 
    status: "success", 
    selected_id: selectedId, 
    app_selections: appSelections 
  });
});

app.get("/api/abtest/events", async (req, res) => {
  const after = req.query.after as string;
  const before = req.query.before as string;
  const limit = parseInt(req.query.limit as string || "100");
  try {
    // Fetch both bloom-app-show and bloom-app-select events
    const [showEvents, selectEvents] = await Promise.all([
      fetchEvents("bloom-app-show", after, before, limit),
      fetchEvents("bloom-app-select", after, before, limit)
    ]);
    // Merge and sort by timestamp descending
    const allEvents = [...(showEvents.results || []), ...(selectEvents.results || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ results: allEvents });
  } catch (error) {
    console.error(`Error in get_abtest_events: ${error}`);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : String(error), 
      details: "Check server logs for more information" 
    });
  }
});

app.get("/api/project-info", async (req, res) => {
  /**Helper endpoint to get project information*/
  
  const projectApiKey = process.env.PUBLIC_POSTHOG_KEY;
  const host = process.env.PUBLIC_POSTHOG_DOMAIN || 'https://us.i.posthog.com';
  
  if (!projectApiKey) {
    return res.status(400).json({ error: "PUBLIC_POSTHOG_KEY not set" });
  }
  
  try {
    // Try to get project info using the project API key
    const url = `${host}/api/projects/`;
    const headers = {
      "Authorization": `Bearer ${projectApiKey}`,
      "Content-Type": "application/json"
    };
    
    const response = await axios.get(url, { headers });
    console.log(`Project info response status: ${response.status}`);
    console.log(`Project info response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200) {
      res.json(response.data);
    } else {
      res.status(500).json({ 
        error: `Failed to get project info: ${response.status}`, 
        response: response.data 
      });
    }
  } catch (error) {
    console.error("Error getting project info:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
}); 