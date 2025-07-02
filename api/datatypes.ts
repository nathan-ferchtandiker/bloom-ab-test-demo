export interface BloomApp {
  id: string;
  image: string;
  origin_pipeline: string; // Indicates how the app was created
  message?: string;
}

export interface AppSelection {
  app_id: string;
  is_selected: boolean;
}

export interface ChatRequest {
  message: string;
  user_id?: string;
}

export interface AppSelectionRequest {
  selected_id: string;
  choices: string[];
  app_selections: AppSelection[];
  user_id?: string;
}

export interface PostHogEvent {
  event: string;
  distinct_id: string;
  properties?: Record<string, any>;
  timestamp?: string;
} 