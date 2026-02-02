"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectForm from "@/components/ProjectForm";
import ProgressBar from "@/components/ProgressBar";
import { TripProject, ProjectSettings, ContentDay, ParsedTrip, GeneratedDay } from "@/lib/types";
import { loadProjects, upsertProject, importProject } from "@/lib/storage";
import { enumerateDays } from "@/lib/date";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<TripProject[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
    message: "",
  });
  const [importJson, setImportJson] = useState("");
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const handleCreateProject = async (data: {
    title: string;
    startDate: string;
    endDate: string;
    itineraryText: string;
    routeHints?: string;
    settings: ProjectSettings;
  }) => {
    setIsGenerating(true);
    setGenerationProgress({
      current: 0,
      total: 3,
      message: "Parsing itinerary...",
    });

    try {
      // Step 1: Create project skeleton
      const projectId = `project-${Date.now()}`;
      const dates = enumerateDays(data.startDate, data.endDate);
      
      const project: TripProject = {
        id: projectId,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        itineraryText: data.itineraryText,
        routeHints: data.routeHints,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: data.settings,
        days: [],
      };

      // Step 2: Parse trip with Anthropic
      setGenerationProgress({
        current: 1,
        total: 3,
        message: "Parsing trip structure...",
      });

      const parseResponse = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "parse_trip",
          payload: {
            itineraryText: data.itineraryText,
            startDate: data.startDate,
            endDate: data.endDate,
            settings: data.settings,
            routeHints: data.routeHints,
          },
        }),
      });

      const parseResult = await parseResponse.json();
      
      if (!parseResult.success) {
        throw new Error(parseResult.error || "Failed to parse trip");
      }

      const parsedTrip: ParsedTrip = parseResult.data;
      
      // Update title if suggested
      if (parsedTrip.titleSuggested) {
        project.title = parsedTrip.titleSuggested;
      }

      // Step 3: Generate content for all days
      setGenerationProgress({
        current: 2,
        total: 3,
        message: `Generating content for ${parsedTrip.days.length} days...`,
      });

      const generateResponse = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate_all_days",
          payload: {
            days: parsedTrip.days,
            settings: data.settings,
            itineraryContext: data.itineraryText,
          },
        }),
      });

      const generateResult = await generateResponse.json();
      
      if (!generateResult.success) {
        throw new Error(generateResult.error || "Failed to generate content");
      }

      const generatedDays: GeneratedDay[] = generateResult.data.days;

      // Combine parsed and generated data
      project.days = parsedTrip.days.map((parsedDay, index) => {
        const generatedDay = generatedDays[index];
        const contentDay: ContentDay = {
          id: `day-${projectId}-${parsedDay.dayIndex}`,
          date: parsedDay.date,
          dayIndex: parsedDay.dayIndex,
          location: parsedDay.location,
          vibe: parsedDay.vibe,
          pillar: generatedDay.pillar,
          hook: generatedDay.hook,
          shots: generatedDay.shots,
          broll: generatedDay.broll,
          captionSeed: generatedDay.captionSeed,
          storyBeats: generatedDay.storyBeats,
          postingTime: generatedDay.postingTime,
          status: "planned",
          notes: parsedDay.notes,
        };
        return contentDay;
      });

      // Save project
      setGenerationProgress({
        current: 3,
        total: 3,
        message: "Saving project...",
      });

      upsertProject(project);
      
      // Navigate to project page
      router.push(`/project/${projectId}`);
    } catch (error) {
      console.error("Error creating project:", error);
      alert(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0, message: "" });
    }
  };

  const handleImport = () => {
    const project = importProject(importJson);
    if (project) {
      upsertProject(project);
      setProjects(loadProjects());
      setImportJson("");
      setShowImport(false);
      router.push(`/project/${project.id}`);
    } else {
      alert("Invalid JSON format");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🚙 Shelby4Runner Content OS
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Transform your road trip plans into a day-by-day content calendar
          </p>
        </header>

        {isGenerating ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-4">Generating Your Content Calendar</h2>
            <ProgressBar
              current={generationProgress.current}
              total={generationProgress.total}
              message={generationProgress.message}
            />
          </div>
        ) : (
          <>
            {!isCreating && (
              <div className="mb-8">
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setIsCreating(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create New Project
                  </button>
                  <button
                    onClick={() => setShowImport(!showImport)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Import Project
                  </button>
                </div>

                {showImport && (
                  <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-3">Import Project from JSON</h3>
                    <textarea
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      placeholder="Paste your project JSON here..."
                      className="w-full h-32 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
                    />
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleImport}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Import
                      </button>
                      <button
                        onClick={() => {
                          setShowImport(false);
                          setImportJson("");
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {projects.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
                    <div className="grid gap-4">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() => router.push(`/project/${project.id}`)}
                          className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                        >
                          <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {project.startDate} to {project.endDate} • {project.days.length} days
                          </p>
                          <div className="flex gap-2 mt-3">
                            {["planned", "filmed", "edited", "posted"].map((status) => {
                              const count = project.days.filter((d) => d.status === status).length;
                              if (count === 0) return null;
                              return (
                                <span
                                  key={status}
                                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded"
                                >
                                  {count} {status}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isCreating && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Create New Project</h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <ProjectForm onSubmit={handleCreateProject} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
