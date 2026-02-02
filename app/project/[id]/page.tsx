"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DayCard from "@/components/DayCard";
import ProgressBar from "@/components/ProgressBar";
import { TripProject, ContentDay, GeneratedDay } from "@/lib/types";
import {
  getProject,
  upsertProject,
  deleteProject,
  downloadJson,
  copyToClipboard,
  exportProject,
  saveProjectsDebounced,
} from "@/lib/storage";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<TripProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ContentDay["status"] | "all">("all");
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [regenerationProgress, setRegenerationProgress] = useState({
    current: 0,
    total: 0,
    message: "",
  });

  useEffect(() => {
    const loadedProject = getProject(projectId);
    if (loadedProject) {
      setProject(loadedProject);
    } else {
      router.push("/");
    }
    setLoading(false);
  }, [projectId, router]);

  const updateDay = (updatedDay: ContentDay) => {
    if (!project) return;
    
    const updatedProject = {
      ...project,
      days: project.days.map((day) =>
        day.id === updatedDay.id ? updatedDay : day
      ),
      updatedAt: Date.now(),
    };
    
    setProject(updatedProject);
    upsertProject(updatedProject);
  };

  const regenerateDay = async (dayId: string) => {
    if (!project) return;
    
    const day = project.days.find((d) => d.id === dayId);
    if (!day) return;
    
    setRegenerating(dayId);
    
    try {
      const response = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate_day",
          payload: {
            day: {
              date: day.date,
              dayIndex: day.dayIndex,
              location: day.location,
              vibe: day.vibe,
            },
            settings: project.settings,
            itineraryContext: project.itineraryText,
          },
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to regenerate day");
      }

      const generatedDay: GeneratedDay = result.data;
      
      // Only update fields that haven't been manually edited
      const updatedDay: ContentDay = {
        ...day,
        ...(day.editedFields?.includes("pillar") ? {} : { pillar: generatedDay.pillar }),
        ...(day.editedFields?.includes("hook") ? {} : { hook: generatedDay.hook }),
        ...(day.editedFields?.includes("shots") ? {} : { shots: generatedDay.shots }),
        ...(day.editedFields?.includes("broll") ? {} : { broll: generatedDay.broll }),
        ...(day.editedFields?.includes("captionSeed") ? {} : { captionSeed: generatedDay.captionSeed }),
        storyBeats: generatedDay.storyBeats,
        postingTime: generatedDay.postingTime,
      };
      
      updateDay(updatedDay);
    } catch (error) {
      console.error("Error regenerating day:", error);
      alert(error instanceof Error ? error.message : "Failed to regenerate day");
    } finally {
      setRegenerating(null);
    }
  };

  const regenerateAll = async () => {
    if (!project) return;
    
    const confirmRegen = confirm(
      "This will regenerate all days. Any manual edits will be preserved if possible. Continue?"
    );
    
    if (!confirmRegen) return;
    
    setRegeneratingAll(true);
    setRegenerationProgress({
      current: 0,
      total: project.days.length,
      message: "Regenerating all days...",
    });
    
    try {
      const response = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate_all_days",
          payload: {
            days: project.days.map((d) => ({
              date: d.date,
              dayIndex: d.dayIndex,
              location: d.location,
              vibe: d.vibe,
            })),
            settings: project.settings,
            itineraryContext: project.itineraryText,
          },
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to regenerate days");
      }

      const generatedDays: GeneratedDay[] = result.data.days;
      
      const updatedDays = project.days.map((day, index) => {
        const generated = generatedDays[index];
        return {
          ...day,
          ...(day.editedFields?.includes("pillar") ? {} : { pillar: generated.pillar }),
          ...(day.editedFields?.includes("hook") ? {} : { hook: generated.hook }),
          ...(day.editedFields?.includes("shots") ? {} : { shots: generated.shots }),
          ...(day.editedFields?.includes("broll") ? {} : { broll: generated.broll }),
          ...(day.editedFields?.includes("captionSeed") ? {} : { captionSeed: generated.captionSeed }),
          storyBeats: generated.storyBeats,
          postingTime: generated.postingTime,
        };
      });
      
      const updatedProject = {
        ...project,
        days: updatedDays,
        updatedAt: Date.now(),
      };
      
      setProject(updatedProject);
      upsertProject(updatedProject);
    } catch (error) {
      console.error("Error regenerating all days:", error);
      alert(error instanceof Error ? error.message : "Failed to regenerate all days");
    } finally {
      setRegeneratingAll(false);
      setRegenerationProgress({ current: 0, total: 0, message: "" });
    }
  };

  const handleExport = async () => {
    if (!project) return;
    
    const json = exportProject(project);
    const copied = await copyToClipboard(json);
    
    if (copied) {
      alert("Project copied to clipboard!");
    }
    
    downloadJson(project);
  };

  const handleDelete = () => {
    if (!project) return;
    
    const confirmDelete = confirm(
      `Are you sure you want to delete "${project.title}"? This cannot be undone.`
    );
    
    if (confirmDelete) {
      deleteProject(project.id);
      router.push("/");
    }
  };

  const updateSettings = (newSettings: Partial<TripProject["settings"]>) => {
    if (!project) return;
    
    const updatedProject = {
      ...project,
      settings: { ...project.settings, ...newSettings },
      updatedAt: Date.now(),
    };
    
    setProject(updatedProject);
    upsertProject(updatedProject);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <p>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <p>Project not found</p>
      </div>
    );
  }

  const filteredDays = filterStatus === "all"
    ? project.days
    : project.days.filter((day) => day.status === filterStatus);

  const statusCounts = {
    all: project.days.length,
    planned: project.days.filter((d) => d.status === "planned").length,
    filmed: project.days.filter((d) => d.status === "filmed").length,
    edited: project.days.filter((d) => d.status === "edited").length,
    posted: project.days.filter((d) => d.status === "posted").length,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <button
                onClick={() => router.push("/")}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 block"
              >
                ← Back to Projects
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {project.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {project.startDate} to {project.endDate} • {project.days.length} days
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export JSON
              </button>
              <button
                onClick={regenerateAll}
                disabled={regeneratingAll}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Regenerate All
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Project
              </button>
            </div>
          </div>

          {regeneratingAll && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-6">
              <ProgressBar
                current={regenerationProgress.current}
                total={regenerationProgress.total}
                message={regenerationProgress.message}
              />
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowItinerary(!showItinerary)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showItinerary ? "Hide" : "Show"} Itinerary
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showSettings ? "Hide" : "Show"} Settings
            </button>
          </div>

          {showItinerary && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">Trip Itinerary</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {project.itineraryText}
              </pre>
              {project.routeHints && (
                <>
                  <h4 className="text-md font-semibold mt-4 mb-2">Route Hints</h4>
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                    {project.routeHints}
                  </pre>
                </>
              )}
            </div>
          )}

          {showSettings && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Project Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Content Tone</label>
                  <select
                    value={project.settings.tone}
                    onChange={(e) =>
                      updateSettings({ tone: e.target.value as TripProject["settings"]["tone"] })
                    }
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
                  >
                    <option value="raw">Raw</option>
                    <option value="poetic">Poetic</option>
                    <option value="funny">Funny</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Posting Cadence</label>
                  <select
                    value={project.settings.cadencePerDay}
                    onChange={(e) =>
                      updateSettings({ cadencePerDay: Number(e.target.value) as 0 | 1 | 2 })
                    }
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
                  >
                    <option value={0}>No posts</option>
                    <option value={1}>1 per day</option>
                    <option value={2}>2 per day</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Dog Emphasis</label>
                  <select
                    value={project.settings.dogEmphasis}
                    onChange={(e) =>
                      updateSettings({
                        dogEmphasis: e.target.value as TripProject["settings"]["dogEmphasis"],
                      })
                    }
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-2">
            {(["all", "planned", "filmed", "edited", "posted"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded whitespace-nowrap ${
                  filterStatus === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)} (
                {statusCounts[status]})
              </button>
            ))}
          </div>
        </header>

        <div className="grid gap-6">
          {filteredDays.map((day) => (
            <div key={day.id} className="relative">
              {regenerating === day.id && (
                <div className="absolute inset-0 bg-white/80 dark:bg-black/80 rounded-lg flex items-center justify-center z-10">
                  <p className="text-lg font-medium">Regenerating...</p>
                </div>
              )}
              <DayCard
                day={day}
                onUpdate={updateDay}
                onRegenerate={() => regenerateDay(day.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}