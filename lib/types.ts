export interface TripProject {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  itineraryText: string;
  createdAt: number;
  updatedAt: number;
  settings: ProjectSettings;
  days: ContentDay[];
  routeHints?: string;
}

export interface ProjectSettings {
  tone: "raw" | "poetic" | "funny" | "minimal";
  cadencePerDay: 0 | 1 | 2;
  pillarWeights: {
    rig: number;
    life: number;
    dog: number;
    journey: number;
  };
  includeRouteHints: boolean;
  dogEmphasis: "low" | "medium" | "high";
}

export interface ContentDay {
  id: string;
  date: string; // YYYY-MM-DD
  dayIndex: number; // 1-based
  location?: string;
  vibe: "travel" | "camp" | "city" | "rest";
  pillar: "rig" | "life" | "dog" | "journey";
  hook: string;
  shots: string[];
  broll: string[];
  captionSeed: string;
  storyBeats?: string[];
  postingTime?: string; // e.g., "18:30"
  status: "planned" | "filmed" | "edited" | "posted";
  metrics?: {
    views?: number;
    likes?: number;
    saves?: number;
    comments?: number;
  };
  notes?: string;
  editedFields?: string[]; // Track which fields have been manually edited
}

export interface ParseTripRequest {
  mode: "parse_trip";
  payload: {
    itineraryText: string;
    startDate: string;
    endDate: string;
    settings: ProjectSettings;
    routeHints?: string;
  };
}

export interface GenerateDayRequest {
  mode: "generate_day";
  payload: {
    day: {
      date: string;
      dayIndex: number;
      location?: string;
      vibe: ContentDay["vibe"];
    };
    settings: ProjectSettings;
    itineraryContext: string;
  };
}

export interface GenerateAllDaysRequest {
  mode: "generate_all_days";
  payload: {
    days: Array<{
      date: string;
      dayIndex: number;
      location?: string;
      vibe: ContentDay["vibe"];
    }>;
    settings: ProjectSettings;
    itineraryContext: string;
  };
}

export type AnthropicRequest = ParseTripRequest | GenerateDayRequest | GenerateAllDaysRequest;

export interface ParsedTrip {
  titleSuggested?: string;
  days: Array<{
    dayIndex: number;
    date: string;
    location?: string;
    vibe: ContentDay["vibe"];
    notes?: string;
  }>;
}

export interface GeneratedDay {
  pillar: ContentDay["pillar"];
  hook: string;
  shots: string[];
  broll: string[];
  captionSeed: string;
  storyBeats?: string[];
  postingTime?: string;
}

export interface AnthropicResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}