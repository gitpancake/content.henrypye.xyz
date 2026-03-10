"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import DayCard from "@/components/DayCard";
import ProgressBar from "@/components/ProgressBar";
import { ConfirmModal, AlertModal, useToast } from "@/components/Modal";
import { TripProject, ContentDay, GeneratedDay } from "@/lib/types";
import { addDays, getDaysBetween } from "@/lib/date";
import {
    getProject,
    upsertProject,
    deleteProject,
    downloadJson,
    copyToClipboard,
    exportProject,
} from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";

export default function ProjectPage() {
    return (
        <Shell>
            <ProjectPageInner />
        </Shell>
    );
}

function ProjectPageInner() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { showToast } = useToast();
    const { user } = useAuth();

    const [project, setProject] = useState<TripProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showItinerary, setShowItinerary] = useState(false);
    const [filterStatus, setFilterStatus] = useState<
        ContentDay["status"] | "all"
    >("all");
    const [regeneratingAll, setRegeneratingAll] = useState(false);
    const [regenerationProgress, setRegenerationProgress] = useState({
        current: 0,
        total: 0,
        message: "",
    });
    const [showMenu, setShowMenu] = useState(false);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [editingDates, setEditingDates] = useState(false);
    const [newStartDate, setNewStartDate] = useState("");

    // Modal states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRegenerateAllConfirm, setShowRegenerateAllConfirm] =
        useState(false);
    const [errorModal, setErrorModal] = useState<{
        isOpen: boolean;
        message: string;
    }>({ isOpen: false, message: "" });

    useEffect(() => {
        getProject(projectId, user.uid).then((loadedProject) => {
            if (loadedProject) {
                setProject(loadedProject);
            } else {
                router.push("/");
            }
            setLoading(false);
        });
    }, [projectId, router]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowMenu(false);
        if (showMenu) {
            document.addEventListener("click", handleClickOutside);
            return () =>
                document.removeEventListener("click", handleClickOutside);
        }
    }, [showMenu]);

    const updateDay = async (updatedDay: ContentDay) => {
        if (!project) return;

        const updatedProject = {
            ...project,
            days: project.days.map((day) =>
                day.id === updatedDay.id ? updatedDay : day,
            ),
            updatedAt: Date.now(),
        };

        setProject(updatedProject);
        await upsertProject(updatedProject, user.uid);
    };

    const regenerateDay = async (
        dayId: string,
        forceRegenerate: boolean = false,
    ) => {
        if (!project) return;

        const day = project.days.find((d) => d.id === dayId);
        if (!day) return;

        // If force regenerate, clear the content-related edited fields first
        const effectiveEditedFields = forceRegenerate
            ? (day.editedFields || []).filter(
                  (f) =>
                      ![
                          "pillar",
                          "hook",
                          "shots",
                          "broll",
                          "captionSeed",
                      ].includes(f),
              )
            : day.editedFields;

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

            const updatedDay: ContentDay = {
                ...day,
                editedFields: forceRegenerate
                    ? effectiveEditedFields
                    : day.editedFields,
                ...(effectiveEditedFields?.includes("pillar")
                    ? {}
                    : { pillar: generatedDay.pillar }),
                ...(effectiveEditedFields?.includes("hook")
                    ? {}
                    : { hook: generatedDay.hook }),
                ...(effectiveEditedFields?.includes("shots")
                    ? {}
                    : {
                          shots: generatedDay.shots.map((text) => ({
                              text,
                              completed: false,
                          })),
                      }),
                ...(effectiveEditedFields?.includes("broll")
                    ? {}
                    : {
                          broll: generatedDay.broll.map((text) => ({
                              text,
                              completed: false,
                          })),
                      }),
                ...(effectiveEditedFields?.includes("captionSeed")
                    ? {}
                    : { captionSeed: generatedDay.captionSeed }),
                storyBeats: generatedDay.storyBeats,
                postingTime: generatedDay.postingTime,
            };

            updateDay(updatedDay);
        } catch (error) {
            console.error("Error regenerating day:", error);
            setErrorModal({
                isOpen: true,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to regenerate day",
            });
        } finally {
            setRegenerating(null);
        }
    };

    const regenerateAll = async () => {
        if (!project) return;

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
                    ...(day.editedFields?.includes("pillar")
                        ? {}
                        : { pillar: generated.pillar }),
                    ...(day.editedFields?.includes("hook")
                        ? {}
                        : { hook: generated.hook }),
                    ...(day.editedFields?.includes("shots")
                        ? {}
                        : {
                              shots: generated.shots.map((text) => ({
                                  text,
                                  completed: false,
                              })),
                          }),
                    ...(day.editedFields?.includes("broll")
                        ? {}
                        : {
                              broll: generated.broll.map((text) => ({
                                  text,
                                  completed: false,
                              })),
                          }),
                    ...(day.editedFields?.includes("captionSeed")
                        ? {}
                        : { captionSeed: generated.captionSeed }),
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
            await upsertProject(updatedProject, user.uid);
        } catch (error) {
            console.error("Error regenerating all days:", error);
            setErrorModal({
                isOpen: true,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to regenerate all days",
            });
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
            showToast("Project copied to clipboard!");
        }

        downloadJson(project);
        setShowMenu(false);
    };

    const handleShare = async () => {
        if (!project) return;

        const shareUrl = `${window.location.origin}/route/${project.id}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: project.title,
                    text: `Check out my ${project.days.length} day road trip itinerary!`,
                    url: shareUrl,
                });
            } catch {
                // User cancelled or share failed, copy to clipboard instead
                await copyToClipboard(shareUrl);
                showToast("Share link copied to clipboard!");
            }
        } else {
            await copyToClipboard(shareUrl);
            showToast("Share link copied to clipboard!");
        }
        setShowMenu(false);
    };

    const handleDelete = async () => {
        if (!project) return;
        await deleteProject(project.id, user.uid);
        router.push("/");
    };

    const updateSettings = async (
        newSettings: Partial<TripProject["settings"]>,
    ) => {
        if (!project) return;

        const updatedProject = {
            ...project,
            settings: { ...project.settings, ...newSettings },
            updatedAt: Date.now(),
        };

        setProject(updatedProject);
        await upsertProject(updatedProject, user.uid);
    };

    const shiftTripDates = async (newStart: string) => {
        if (!project) return;

        const tripLength = getDaysBetween(project.startDate, project.endDate);
        const newEndDate = addDays(newStart, tripLength - 1);

        // Update all day dates
        const updatedDays = project.days.map((day) => ({
            ...day,
            date: addDays(newStart, day.dayIndex - 1),
        }));

        const updatedProject = {
            ...project,
            startDate: newStart,
            endDate: newEndDate,
            days: updatedDays,
            updatedAt: Date.now(),
        };

        setProject(updatedProject);
        await upsertProject(updatedProject, user.uid);
        setEditingDates(false);
        setNewStartDate("");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Project not found</p>
            </div>
        );
    }

    const filteredDays =
        filterStatus === "all"
            ? project.days
            : project.days.filter((day) => day.status === filterStatus);

    const statusCounts = {
        all: project.days.length,
        planned: project.days.filter((d) => d.status === "planned").length,
        filmed: project.days.filter((d) => d.status === "filmed").length,
        edited: project.days.filter((d) => d.status === "edited").length,
        posted: project.days.filter((d) => d.status === "posted").length,
    };

    const progress = Math.round((statusCounts.posted / statusCounts.all) * 100);

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
        <>
            <div className="max-w-2xl mx-auto">
                {/* Project Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/")}
                            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <svg
                                className="w-5 h-5 text-muted-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>

                        <div>
                            <h1 className="font-semibold text-foreground truncate">
                                {project.title}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                {formatDateRange(
                                    project.startDate,
                                    project.endDate,
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <svg
                                className="w-5 h-5 text-muted-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                            </svg>
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-12 w-48 bg-card rounded-xl shadow-sm border border-border py-2 animate-fade-in z-50">
                                <button
                                    onClick={handleShare}
                                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                        />
                                    </svg>
                                    Share Route
                                </button>
                                <div className="border-t border-border my-1" />
                                <button
                                    onClick={() => {
                                        setShowItinerary(!showItinerary);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    View Itinerary
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSettings(!showSettings);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    Settings
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                        />
                                    </svg>
                                    Export JSON
                                </button>
                                <button
                                    onClick={() => {
                                        setShowRegenerateAllConfirm(true);
                                        setShowMenu(false);
                                    }}
                                    disabled={regeneratingAll}
                                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 disabled:opacity-50"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    Regenerate All
                                </button>
                                <div className="border-t border-border my-2" />
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    Delete Project
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Summary */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">
                            Trip Progress
                        </span>
                        <span className="text-sm font-semibold text-primary">
                            {progress}% complete
                        </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                        <span>{statusCounts.posted} posted</span>
                        <span>{statusCounts.all} total days</span>
                    </div>
                </div>

                {/* Regeneration Progress */}
                {regeneratingAll && (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-4 animate-fade-in">
                        <ProgressBar
                            current={regenerationProgress.current}
                            total={regenerationProgress.total}
                            message={regenerationProgress.message}
                        />
                    </div>
                )}

                {/* Itinerary Panel */}
                {showItinerary && (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-foreground">
                                Trip Itinerary
                            </h3>
                            <button
                                onClick={() => setShowItinerary(false)}
                                className="p-1 hover:bg-muted rounded-full"
                            >
                                <svg
                                    className="w-4 h-4 text-muted-foreground"
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
                        <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted rounded-xl p-4 max-h-64 overflow-y-auto">
                            {project.itineraryText}
                        </pre>
                        {project.routeHints && (
                            <>
                                <h4 className="font-medium text-foreground mt-4 mb-2">
                                    Route Hints
                                </h4>
                                <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted rounded-xl p-4">
                                    {project.routeHints}
                                </pre>
                            </>
                        )}
                    </div>
                )}

                {/* Settings Panel */}
                {showSettings && (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-foreground">
                                Settings
                            </h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-1 hover:bg-muted rounded-full"
                            >
                                <svg
                                    className="w-4 h-4 text-muted-foreground"
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
                        <div className="space-y-4">
                            {/* Trip Dates */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Trip Dates
                                </label>
                                {editingDates ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-muted-foreground mb-1">
                                                New Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={newStartDate}
                                                onChange={(e) =>
                                                    setNewStartDate(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-3 rounded-xl border border-border bg-muted focus:bg-card focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all"
                                            />
                                        </div>
                                        {newStartDate && (
                                            <p className="text-xs text-muted-foreground">
                                                Trip will be shifted to{" "}
                                                {newStartDate} -{" "}
                                                {addDays(
                                                    newStartDate,
                                                    getDaysBetween(
                                                        project.startDate,
                                                        project.endDate,
                                                    ) - 1,
                                                )}
                                            </p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    newStartDate &&
                                                    shiftTripDates(newStartDate)
                                                }
                                                disabled={!newStartDate}
                                                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                                            >
                                                Update Dates
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingDates(false);
                                                    setNewStartDate("");
                                                }}
                                                className="px-4 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {formatDateRange(
                                                    project.startDate,
                                                    project.endDate,
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {project.days.length} days
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingDates(true);
                                                setNewStartDate(
                                                    project.startDate,
                                                );
                                            }}
                                            className="px-3 py-1.5 text-sm text-primary font-medium hover:bg-accent rounded-lg transition-colors"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Content Tone
                                </label>
                                <select
                                    value={project.settings.tone}
                                    onChange={(e) =>
                                        updateSettings({
                                            tone: e.target
                                                .value as TripProject["settings"]["tone"],
                                        })
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted focus:bg-card focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all"
                                >
                                    <option value="raw">Raw - Authentic</option>
                                    <option value="poetic">
                                        Poetic - Reflective
                                    </option>
                                    <option value="funny">
                                        Funny - Lighthearted
                                    </option>
                                    <option value="minimal">
                                        Minimal - Concise
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Posting Cadence
                                </label>
                                <select
                                    value={project.settings.cadencePerDay}
                                    onChange={(e) =>
                                        updateSettings({
                                            cadencePerDay: Number(
                                                e.target.value,
                                            ) as 0 | 1 | 2,
                                        })
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted focus:bg-card focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all"
                                >
                                    <option value={0}>No posts</option>
                                    <option value={1}>1 per day</option>
                                    <option value={2}>2 per day</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Dog Emphasis
                                </label>
                                <select
                                    value={project.settings.dogEmphasis}
                                    onChange={(e) =>
                                        updateSettings({
                                            dogEmphasis: e.target
                                                .value as TripProject["settings"]["dogEmphasis"],
                                        })
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted focus:bg-card focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                    {(
                        [
                            "all",
                            "planned",
                            "filmed",
                            "edited",
                            "posted",
                        ] as const
                    ).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                filterStatus === status
                                    ? "bg-primary text-white shadow-sm"
                                    : "bg-card text-muted-foreground border border-border hover:border-border"
                            }`}
                        >
                            {status === "all"
                                ? "All"
                                : status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                            <span className="ml-1.5 opacity-75">
                                ({statusCounts[status]})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Days List */}
                <div className="space-y-3">
                    {filteredDays.map((day, idx) => (
                        <div
                            key={day.id}
                            className="relative animate-fade-in"
                            style={{ animationDelay: `${idx * 30}ms` }}
                        >
                            {regenerating === day.id && (
                                <div className="absolute inset-0 bg-card/90 rounded-xl flex items-center justify-center z-10">
                                    <div className="flex items-center gap-3">
                                        <svg
                                            className="w-5 h-5 text-primary animate-spin"
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
                                        <span className="text-sm font-medium text-foreground">
                                            Regenerating...
                                        </span>
                                    </div>
                                </div>
                            )}
                            <DayCard
                                day={day}
                                onUpdate={updateDay}
                                onRegenerate={(force) =>
                                    regenerateDay(day.id, force)
                                }
                                isExpanded={expandedDay === day.id}
                                onToggleExpand={() =>
                                    setExpandedDay(
                                        expandedDay === day.id ? null : day.id,
                                    )
                                }
                            />
                        </div>
                    ))}
                </div>

                {filteredDays.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            No days with this status
                        </p>
                    </div>
                )}
            </div>

            {/* Confirmation Modals */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Project"
                message={`Are you sure you want to delete "${project?.title}"? This cannot be undone.`}
                confirmText="Delete"
                confirmVariant="danger"
            />

            <ConfirmModal
                isOpen={showRegenerateAllConfirm}
                onClose={() => setShowRegenerateAllConfirm(false)}
                onConfirm={regenerateAll}
                title="Regenerate All Days"
                message="This will regenerate all days. Any manual edits will be preserved."
                confirmText="Regenerate"
                confirmVariant="primary"
            />

            <AlertModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ isOpen: false, message: "" })}
                title="Error"
                message={errorModal.message}
                variant="error"
            />
        </>
    );
}
