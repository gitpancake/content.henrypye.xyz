"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectForm from "@/components/ProjectForm";
import ProgressBar from "@/components/ProgressBar";
import {
    TripProject,
    ProjectSettings,
    ContentDay,
    ParsedTrip,
    GeneratedDay,
} from "@/lib/types";
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

            if (parsedTrip.titleSuggested) {
                project.title = parsedTrip.titleSuggested;
            }

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
                throw new Error(
                    generateResult.error || "Failed to generate content",
                );
            }

            const generatedDays: GeneratedDay[] = generateResult.data.days;

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
                    shots: generatedDay.shots.map((text) => ({
                        text,
                        completed: false,
                    })),
                    broll: generatedDay.broll.map((text) => ({
                        text,
                        completed: false,
                    })),
                    captionSeed: generatedDay.captionSeed,
                    storyBeats: generatedDay.storyBeats,
                    postingTime: generatedDay.postingTime,
                    status: "planned",
                    notes: parsedDay.notes,
                };
                return contentDay;
            });

            setGenerationProgress({
                current: 3,
                total: 3,
                message: "Saving project...",
            });

            upsertProject(project);
            router.push(`/project/${projectId}`);
        } catch (error) {
            console.error("Error creating project:", error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to create project",
            );
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

    const getProjectProgress = (project: TripProject) => {
        const total = project.days.length;
        const posted = project.days.filter((d) => d.status === "posted").length;
        return Math.round((posted / total) * 100);
    };

    const formatDateRange = (start: string, end: string) => {
        const startDate = new Date(start + "T00:00:00");
        const endDate = new Date(end + "T00:00:00");
        const options: Intl.DateTimeFormatOptions = {
            month: "short",
            day: "numeric",
        };
        return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-stone-200">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-stone-900">
                                Content Calendar
                            </h1>
                            <p className="text-sm text-stone-500">
                                Plan your road trip content
                            </p>
                        </div>
                        {!isCreating && !isGenerating && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/25"
                            >
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
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                <span className="hidden sm:inline">
                                    New Trip
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
                {isGenerating ? (
                    <div className="animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 text-orange-600 animate-pulse"
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
                                </div>
                                <div>
                                    <h2 className="font-semibold text-stone-900">
                                        Creating Your Calendar
                                    </h2>
                                    <p className="text-sm text-stone-500">
                                        AI is generating your content plan
                                    </p>
                                </div>
                            </div>
                            <ProgressBar
                                current={generationProgress.current}
                                total={generationProgress.total}
                                message={generationProgress.message}
                            />
                        </div>
                    </div>
                ) : isCreating ? (
                    <div className="animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-stone-100">
                                <h2 className="font-semibold text-stone-900">
                                    New Trip
                                </h2>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5 text-stone-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4">
                                <ProjectForm onSubmit={handleCreateProject} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Import Section */}
                        {showImport && (
                            <div className="mb-6 animate-fade-in">
                                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4">
                                    <h3 className="font-medium text-stone-900 mb-3">
                                        Import Project
                                    </h3>
                                    <textarea
                                        value={importJson}
                                        onChange={(e) =>
                                            setImportJson(e.target.value)
                                        }
                                        placeholder="Paste your project JSON here..."
                                        className="w-full h-32 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                                    />
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={handleImport}
                                            className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                                        >
                                            Import
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowImport(false);
                                                setImportJson("");
                                            }}
                                            className="px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Projects List */}
                        {projects.length === 0 ? (
                            <div className="text-center py-16 animate-fade-in">
                                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-10 h-10 text-stone-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-stone-900 mb-2">
                                    No trips yet
                                </h3>
                                <p className="text-stone-500 mb-6 max-w-sm mx-auto">
                                    Start planning your road trip content by
                                    creating a new project
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25"
                                    >
                                        Create Your First Trip
                                    </button>
                                    <button
                                        onClick={() => setShowImport(true)}
                                        className="px-6 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                                    >
                                        Import Existing
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-stone-900">
                                        Your Trips
                                    </h2>
                                    <button
                                        onClick={() =>
                                            setShowImport(!showImport)
                                        }
                                        className="text-sm text-orange-600 font-medium hover:text-orange-700"
                                    >
                                        {showImport ? "Hide Import" : "Import"}
                                    </button>
                                </div>

                                {projects.map((project, idx) => {
                                    const progress =
                                        getProjectProgress(project);
                                    const statusCounts = {
                                        planned: project.days.filter(
                                            (d) => d.status === "planned",
                                        ).length,
                                        filmed: project.days.filter(
                                            (d) => d.status === "filmed",
                                        ).length,
                                        edited: project.days.filter(
                                            (d) => d.status === "edited",
                                        ).length,
                                        posted: project.days.filter(
                                            (d) => d.status === "posted",
                                        ).length,
                                    };

                                    return (
                                        <div
                                            key={project.id}
                                            onClick={() =>
                                                router.push(
                                                    `/project/${project.id}`,
                                                )
                                            }
                                            className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 cursor-pointer card-hover animate-fade-in"
                                            style={{
                                                animationDelay: `${idx * 50}ms`,
                                            }}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-stone-900 truncate">
                                                        {project.title}
                                                    </h3>
                                                    <p className="text-sm text-stone-500 mt-0.5">
                                                        {formatDateRange(
                                                            project.startDate,
                                                            project.endDate,
                                                        )}{" "}
                                                        · {project.days.length}{" "}
                                                        days
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 ml-3">
                                                    <span className="text-sm font-medium text-stone-900">
                                                        {progress}%
                                                    </span>
                                                    <svg
                                                        className="w-4 h-4 text-stone-400"
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
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-3">
                                                <div
                                                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />
                                            </div>

                                            {/* Status pills */}
                                            <div className="flex flex-wrap gap-2">
                                                {statusCounts.planned > 0 && (
                                                    <span className="status-planned text-xs px-2.5 py-1 rounded-full font-medium">
                                                        {statusCounts.planned}{" "}
                                                        planned
                                                    </span>
                                                )}
                                                {statusCounts.filmed > 0 && (
                                                    <span className="status-filmed text-xs px-2.5 py-1 rounded-full font-medium">
                                                        {statusCounts.filmed}{" "}
                                                        filmed
                                                    </span>
                                                )}
                                                {statusCounts.edited > 0 && (
                                                    <span className="status-edited text-xs px-2.5 py-1 rounded-full font-medium">
                                                        {statusCounts.edited}{" "}
                                                        edited
                                                    </span>
                                                )}
                                                {statusCounts.posted > 0 && (
                                                    <span className="status-posted text-xs px-2.5 py-1 rounded-full font-medium">
                                                        {statusCounts.posted}{" "}
                                                        posted
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
