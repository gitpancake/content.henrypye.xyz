import { ProjectSettings, ContentDay } from "./types";

export function buildParseTripPrompt(
  itineraryText: string,
  startDate: string,
  endDate: string,
  settings: ProjectSettings,
  routeHints?: string
): string {
  return `You are parsing a road trip itinerary into a structured day-by-day plan for content creation.

ITINERARY TEXT:
${itineraryText}

${routeHints ? `ROUTE HINTS/STOPS:
${routeHints}` : ""}

START DATE: ${startDate}
END DATE: ${endDate}

Generate a JSON response with a suggested title and a day-by-day breakdown.
You MUST generate EXACTLY the correct number of days between ${startDate} and ${endDate} (inclusive).

For each day, determine:
- dayIndex: sequential number starting from 1
- date: in YYYY-MM-DD format
- location: the main location/stop for that day (null if unclear)
- vibe: categorize as one of:
  - "travel": long driving days between destinations
  - "camp": national parks, campgrounds, outdoor spots
  - "city": urban areas, towns
  - "rest": buffer days, maintenance, resupply
- notes: any relevant context from the itinerary

If the itinerary has fewer stops than days, spread them logically.
If it has more stops than days, group nearby locations.

Respond ONLY with valid JSON matching this structure:
{
  "titleSuggested": "optional suggested project title",
  "days": [
    {
      "dayIndex": 1,
      "date": "YYYY-MM-DD",
      "location": "string or null",
      "vibe": "travel|camp|city|rest",
      "notes": "optional notes"
    }
  ]
}`;
}

export function buildGenerateDayPrompt(
  day: {
    date: string;
    dayIndex: number;
    location?: string;
    vibe: ContentDay["vibe"];
  },
  settings: ProjectSettings,
  itineraryContext: string
): string {
  const toneDescriptions = {
    raw: "authentic, unfiltered, real moments as they happen",
    poetic: "reflective, thoughtful, finding meaning in the journey",
    funny: "lighthearted, self-aware, finding humor in overlanding life",
    minimal: "concise, essential details only, let visuals speak",
  };

  const dogInstructions = {
    low: "Shelby appears occasionally, natural presence",
    medium: "Include Shelby in at least 1-2 shots, part of the journey",
    high: "Shelby is a main character, feature in 2-3+ shots",
  };

  return `You are creating a content plan for day ${day.dayIndex} of a road trip.

DAY DETAILS:
- Date: ${day.date}
- Location: ${day.location || "En route"}
- Vibe: ${day.vibe}

FULL TRIP CONTEXT:
${itineraryContext}

CONTENT SETTINGS:
- Tone: ${settings.tone} (${toneDescriptions[settings.tone]})
- Dog emphasis: ${settings.dogEmphasis} (${dogInstructions[settings.dogEmphasis]})
- Posting cadence: ${settings.cadencePerDay} post(s) per day

Create a content plan for this day. Guidelines:
- Pillar: Choose from "rig" (4Runner/gear), "life" (lifestyle/camping), "dog" (Shelby content), or "journey" (travel/exploration)
- Hook: Under 120 chars, authentic not influencer-y, avoid buzzwords
- Shots: 5-8 specific, practical phone shots (e.g., "Tailgate coffee pour with steam", "POV loading RTT ladder", "Shelby watching sunset from camp chair")
- B-roll: Supporting footage to fill transitions
- Caption seed: 1-3 sentences matching the tone setting
- Story beats: Optional narrative moments
- Posting time: Optimal time in 24hr format (e.g., "18:30")

${settings.dogEmphasis !== "low" ? "Remember to include Shelby in shots as specified." : ""}

Respond ONLY with valid JSON:
{
  "pillar": "rig|life|dog|journey",
  "hook": "string under 120 chars",
  "shots": ["shot1", "shot2", "..."],
  "broll": ["broll1", "broll2", "..."],
  "captionSeed": "1-3 sentence caption",
  "storyBeats": ["beat1", "beat2"],
  "postingTime": "HH:MM"
}`;
}

export function buildGenerateAllDaysPrompt(
  days: Array<{
    date: string;
    dayIndex: number;
    location?: string;
    vibe: ContentDay["vibe"];
  }>,
  settings: ProjectSettings,
  itineraryContext: string
): string {
  const toneDescriptions = {
    raw: "authentic, unfiltered, real moments",
    poetic: "reflective, finding meaning in the journey",
    funny: "lighthearted, self-aware humor",
    minimal: "concise, let visuals speak",
  };

  const dogInstructions = {
    low: "Shelby appears occasionally",
    medium: "Include Shelby in 1-2 shots per day",
    high: "Shelby featured in 2-3+ shots per day",
  };

  const daysList = days
    .map(
      (d) =>
        `Day ${d.dayIndex} (${d.date}): ${d.location || "En route"} - ${d.vibe}`
    )
    .join("\n");

  return `Create content plans for ${days.length} days of a road trip.

TRIP OVERVIEW:
${itineraryContext}

DAYS TO PLAN:
${daysList}

SETTINGS:
- Tone: ${settings.tone} (${toneDescriptions[settings.tone]})
- Dog: ${settings.dogEmphasis} (${dogInstructions[settings.dogEmphasis]})
- Cadence: ${settings.cadencePerDay} post(s) per day

For EACH day, create:
- pillar: "rig", "life", "dog", or "journey"
- hook: Under 120 chars, authentic
- shots: 5-8 specific phone shots
- broll: Supporting footage
- captionSeed: 1-3 sentences
- storyBeats: Optional narrative moments
- postingTime: HH:MM format

Vary pillars across days. Make shots specific and practical.

Respond ONLY with valid JSON:
{
  "days": [
    {
      "pillar": "rig|life|dog|journey",
      "hook": "string",
      "shots": ["..."],
      "broll": ["..."],
      "captionSeed": "string",
      "storyBeats": ["..."],
      "postingTime": "HH:MM"
    }
  ]
}`;
}