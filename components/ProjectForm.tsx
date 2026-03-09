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

    const toneOptions = [
        { value: "raw", label: "Raw", description: "Authentic & unfiltered" },
        {
            value: "poetic",
            label: "Poetic",
            description: "Reflective & thoughtful",
        },
        { value: "funny", label: "Funny", description: "Lighthearted & fun" },
        { value: "minimal", label: "Minimal", description: "Concise & visual" },
    ];

    const dogOptions = [
        { value: "low", label: "Low", description: "Occasional cameos" },
        { value: "medium", label: "Medium", description: "Regular feature" },
        { value: "high", label: "High", description: "Main character" },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Trip Name */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Trip Name
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Pacific Coast Highway Adventure"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted focus:bg-card focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all"
                />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted focus:bg-card focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        End Date
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        min={startDate}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted focus:bg-card focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all"
                    />
                </div>
            </div>

            {/* Itinerary */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Trip Itinerary
                </label>
                <textarea
                    value={itineraryText}
                    onChange={(e) => setItineraryText(e.target.value)}
                    required
                    rows={5}
                    placeholder="Paste your road trip plan here. Can be freeform text, notes from ChatGPT, or any format..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted focus:bg-card focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                    AI will parse this into a day-by-day content calendar
                </p>
            </div>

            {/* Route Hints */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Route Hints
                    <span className="text-muted-foreground font-normal ml-1">
                        (optional)
                    </span>
                </label>
                <textarea
                    value={routeHints}
                    onChange={(e) => setRouteHints(e.target.value)}
                    rows={2}
                    placeholder="Additional stops, waypoints, or route details..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted focus:bg-card focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all resize-none"
                />
            </div>

            {/* Settings Toggle */}
            <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary transition-colors"
            >
                <svg
                    className={`w-4 h-4 transition-transform ${showSettings ? "rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
                {showSettings ? "Hide" : "Show"} content settings
            </button>

            {/* Advanced Settings */}
            {showSettings && (
                <div className="space-y-5 p-4 bg-muted rounded-xl border border-border animate-fade-in">
                    {/* Tone */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                            Content Tone
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {toneOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            tone: option.value as ProjectSettings["tone"],
                                        })
                                    }
                                    className={`p-3 rounded-xl text-left transition-all border-2 ${
                                        settings.tone === option.value
                                            ? "bg-accent border-primary text-primary"
                                            : "bg-card border-border text-muted-foreground hover:border-border"
                                    }`}
                                >
                                    <span className="block text-sm font-medium">
                                        {option.label}
                                    </span>
                                    <span className="block text-xs opacity-70 mt-0.5">
                                        {option.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cadence */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                            Posts Per Day
                        </label>
                        <div className="flex gap-2">
                            {[0, 1, 2].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            cadencePerDay: num as 0 | 1 | 2,
                                        })
                                    }
                                    className={`flex-1 py-3 rounded-xl text-center text-sm font-medium transition-all border-2 ${
                                        settings.cadencePerDay === num
                                            ? "bg-accent border-primary text-primary"
                                            : "bg-card border-border text-muted-foreground hover:border-border"
                                    }`}
                                >
                                    {num === 0 ? "None" : num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dog Emphasis */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                            Shelby (Dog) Content
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {dogOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            dogEmphasis:
                                                option.value as ProjectSettings["dogEmphasis"],
                                        })
                                    }
                                    className={`p-3 rounded-xl text-center transition-all border-2 ${
                                        settings.dogEmphasis === option.value
                                            ? "bg-pink-50 border-pink-400 text-pink-700"
                                            : "bg-card border-border text-muted-foreground hover:border-border"
                                    }`}
                                >
                                    <span className="block text-sm font-medium">
                                        {option.label}
                                    </span>
                                    <span className="block text-xs opacity-70 mt-0.5">
                                        {option.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Include Route Hints */}
                    <label className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border cursor-pointer hover:border-border transition-colors">
                        <input
                            type="checkbox"
                            checked={settings.includeRouteHints}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    includeRouteHints: e.target.checked,
                                })
                            }
                            className="rounded border-border text-primary focus:ring-primary"
                        />
                        <div>
                            <span className="block text-sm font-medium text-foreground">
                                Include route hints in AI generation
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                Use your route hints when generating content
                                ideas
                            </span>
                        </div>
                    </label>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading || !title || !itineraryText}
                className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all shadow-sm disabled:shadow-none flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg
                            className="w-5 h-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Generating...
                    </>
                ) : (
                    <>
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                        Generate Calendar
                    </>
                )}
            </button>
        </form>
    );
}
