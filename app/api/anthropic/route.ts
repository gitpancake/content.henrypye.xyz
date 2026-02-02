import { NextRequest, NextResponse } from "next/server";
import {
  buildParseTripPrompt,
  buildGenerateDayPrompt,
  buildGenerateAllDaysPrompt,
} from "@/lib/prompts";
import {
  ParsedTripSchema,
  GeneratedDaySchema,
  GeneratedDaysResponseSchema,
  validateAndRepair,
} from "@/lib/schemas";
import { AnthropicRequest } from "@/lib/types";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-3-5-sonnet-latest";

async function callAnthropic(prompt: string, maxRetries = 1): Promise<any> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const systemPrompt = `You are a content planning assistant for a road trip content creator. 
Always respond with valid JSON only. No markdown, no code blocks, no explanations. 
Just pure JSON that can be parsed with JSON.parse().`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;
      
      if (!content) {
        throw new Error("No content in Anthropic response");
      }

      // Try to parse as JSON
      try {
        return JSON.parse(content);
      } catch (parseError) {
        // Try to extract JSON from the response if it's wrapped in markdown
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        
        // Try to find JSON-like content
        const startIndex = content.indexOf("{");
        const endIndex = content.lastIndexOf("}");
        if (startIndex !== -1 && endIndex !== -1) {
          const jsonStr = content.substring(startIndex, endIndex + 1);
          return JSON.parse(jsonStr);
        }
        
        throw parseError;
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // If first attempt failed, try with a repair prompt
      if (attempt === 0 && error instanceof Error && error.message.includes("JSON")) {
        prompt = `The previous response was not valid JSON. Please fix it and respond with ONLY valid JSON.
Previous attempt may have had markdown or explanations. Remove all of that.
Here's the original request again: ${prompt}`;
      }
    }
  }
  
  throw new Error("Failed to get valid response from Anthropic");
}

export async function POST(request: NextRequest) {
  try {
    const body: AnthropicRequest = await request.json();

    switch (body.mode) {
      case "parse_trip": {
        const { itineraryText, startDate, endDate, settings, routeHints } = body.payload;
        
        const prompt = buildParseTripPrompt(
          itineraryText,
          startDate,
          endDate,
          settings,
          routeHints
        );
        
        const rawResponse = await callAnthropic(prompt);
        const validation = validateAndRepair(ParsedTripSchema, rawResponse);
        
        if (!validation.success) {
          // Try to repair with another call
          const repairPrompt = `Fix this JSON to match the required schema. The error was: ${validation.error}
          
JSON to fix: ${JSON.stringify(rawResponse)}

Required structure:
{
  "titleSuggested": "optional string",
  "days": [
    {
      "dayIndex": number,
      "date": "YYYY-MM-DD",
      "location": "string or null",
      "vibe": "travel|camp|city|rest",
      "notes": "optional string"
    }
  ]
}

Respond with ONLY the fixed JSON.`;
          
          const repairedResponse = await callAnthropic(repairPrompt, 0);
          const repairedValidation = validateAndRepair(ParsedTripSchema, repairedResponse);
          
          if (!repairedValidation.success) {
            return NextResponse.json(
              { success: false, error: repairedValidation.error },
              { status: 400 }
            );
          }
          
          return NextResponse.json({ success: true, data: repairedValidation.data });
        }
        
        return NextResponse.json({ success: true, data: validation.data });
      }

      case "generate_day": {
        const { day, settings, itineraryContext } = body.payload;
        
        const prompt = buildGenerateDayPrompt(day, settings, itineraryContext);
        const rawResponse = await callAnthropic(prompt);
        const validation = validateAndRepair(GeneratedDaySchema, rawResponse);
        
        if (!validation.success) {
          return NextResponse.json(
            { success: false, error: validation.error },
            { status: 400 }
          );
        }
        
        return NextResponse.json({ success: true, data: validation.data });
      }

      case "generate_all_days": {
        const { days, settings, itineraryContext } = body.payload;
        
        // Split into chunks of 5 days to avoid token limits
        const chunks = [];
        for (let i = 0; i < days.length; i += 5) {
          chunks.push(days.slice(i, i + 5));
        }
        
        const allGeneratedDays = [];
        
        for (const chunk of chunks) {
          const prompt = buildGenerateAllDaysPrompt(chunk, settings, itineraryContext);
          const rawResponse = await callAnthropic(prompt);
          const validation = validateAndRepair(GeneratedDaysResponseSchema, rawResponse);
          
          if (!validation.success) {
            return NextResponse.json(
              { success: false, error: validation.error },
              { status: 400 }
            );
          }
          
          allGeneratedDays.push(...validation.data.days);
        }
        
        return NextResponse.json({ 
          success: true, 
          data: { days: allGeneratedDays } 
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid mode" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}