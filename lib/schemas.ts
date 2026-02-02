import { z } from "zod";

export const ProjectSettingsSchema = z.object({
  tone: z.enum(["raw", "poetic", "funny", "minimal"]),
  cadencePerDay: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  pillarWeights: z.object({
    rig: z.number().min(0).max(1),
    life: z.number().min(0).max(1),
    dog: z.number().min(0).max(1),
    journey: z.number().min(0).max(1),
  }),
  includeRouteHints: z.boolean(),
  dogEmphasis: z.enum(["low", "medium", "high"]),
});

export const ContentDaySchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayIndex: z.number().int().positive(),
  location: z.string().optional(),
  vibe: z.enum(["travel", "camp", "city", "rest"]),
  pillar: z.enum(["rig", "life", "dog", "journey"]),
  hook: z.string().max(120),
  shots: z.array(z.string()).min(5).max(8),
  broll: z.array(z.string()),
  captionSeed: z.string(),
  storyBeats: z.array(z.string()).optional(),
  postingTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z.enum(["planned", "filmed", "edited", "posted"]),
  metrics: z
    .object({
      views: z.number().optional(),
      likes: z.number().optional(),
      saves: z.number().optional(),
      comments: z.number().optional(),
    })
    .optional(),
  notes: z.string().optional(),
  editedFields: z.array(z.string()).optional(),
});

export const TripProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  itineraryText: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  settings: ProjectSettingsSchema,
  days: z.array(ContentDaySchema),
  routeHints: z.string().optional(),
});

export const ParsedTripSchema = z.object({
  titleSuggested: z.string().optional(),
  days: z.array(
    z.object({
      dayIndex: z.number().int().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      location: z.string().optional(),
      vibe: z.enum(["travel", "camp", "city", "rest"]),
      notes: z.string().optional(),
    })
  ),
});

export const GeneratedDaySchema = z.object({
  pillar: z.enum(["rig", "life", "dog", "journey"]),
  hook: z.string().max(120),
  shots: z.array(z.string()).min(5).max(8),
  broll: z.array(z.string()),
  captionSeed: z.string(),
  storyBeats: z.array(z.string()).optional(),
  postingTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const GeneratedDaysResponseSchema = z.object({
  days: z.array(GeneratedDaySchema),
});

export function validateAndRepair<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; error?: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation failed: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`,
      };
    }
    return { success: false, error: "Unknown validation error" };
  }
}