"use client";

import { useState } from "react";
import { getToday, addDays } from "@/lib/date";
import { ProjectSettings } from "@/lib/types";

interface ProjectFormProps {
  onSubmit: (data: {
    title: string;
    startDate: string;
    endDate: string;
    itineraryText: string;
    routeHints?: string;
    settings: ProjectSettings;
  }) => void;
  isLoading?: boolean;
}

export default function ProjectForm({ onSubmit, isLoading }: ProjectFormProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(addDays(getToday(), 7));
  const [itineraryText, setItineraryText] = useState("");
  const [routeHints, setRouteHints] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  
  const [settings, setSettings] = useState<ProjectSettings>({
    tone: "raw",
    cadencePerDay: 1,
    pillarWeights: {
      rig: 0.25,
      life: 0.25,
      dog: 0.25,
      journey: 0.25,
    },
    includeRouteHints: false,
    dogEmphasis: "medium",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      startDate,
      endDate,
      itineraryText,
      routeHints: routeHints || undefined,
      settings,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Project Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., Pacific Coast Highway Adventure"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            min={startDate}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Trip Itinerary
        </label>
        <textarea
          value={itineraryText}
          onChange={(e) => setItineraryText(e.target.value)}
          required
          rows={6}
          placeholder="Paste your road trip plan here. Can be freeform text from ChatGPT, notes, or any format..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Route Hints / Stops (Optional)
        </label>
        <textarea
          value={routeHints}
          onChange={(e) => setRouteHints(e.target.value)}
          rows={3}
          placeholder="Additional stops, waypoints, or route details..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showSettings ? "Hide" : "Show"} Advanced Settings
        </button>
      </div>

      {showSettings && (
        <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Content Tone</label>
            <select
              value={settings.tone}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  tone: e.target.value as ProjectSettings["tone"],
                })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900"
            >
              <option value="raw">Raw - Authentic, unfiltered</option>
              <option value="poetic">Poetic - Reflective, thoughtful</option>
              <option value="funny">Funny - Lighthearted, humorous</option>
              <option value="minimal">Minimal - Concise, visual-focused</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Posting Cadence (per day)
            </label>
            <select
              value={settings.cadencePerDay}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cadencePerDay: Number(e.target.value) as 0 | 1 | 2,
                })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900"
            >
              <option value={0}>No posts (content bank only)</option>
              <option value={1}>1 post per day</option>
              <option value={2}>2 posts per day</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Shelby (Dog) Content Emphasis
            </label>
            <select
              value={settings.dogEmphasis}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  dogEmphasis: e.target.value as ProjectSettings["dogEmphasis"],
                })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900"
            >
              <option value="low">Low - Occasional appearances</option>
              <option value="medium">Medium - Regular feature (1-2 shots)</option>
              <option value="high">High - Main character (2-3+ shots)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.includeRouteHints}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    includeRouteHints: e.target.checked,
                  })
                }
                className="rounded"
              />
              <span className="text-sm">Include route hints in generation</span>
            </label>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !title || !itineraryText}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Generating Calendar..." : "Generate Calendar"}
      </button>
    </form>
  );
}