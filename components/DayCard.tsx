"use client";

import { useState } from "react";
import {
    ContentDay,
    normalizeShots,
    normalizeBroll,
    ShotItem,
    BrollItem,
} from "@/lib/types";
import { formatDisplayDate } from "@/lib/date";
import DayEditor from "./DayEditor";

interface DayCardProps {
    day: ContentDay;
    onUpdate: (day: ContentDay) => void;
    onRegenerate: () => void;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

export default function DayCard({
    day,
    onUpdate,
    onRegenerate,
    isExpanded,
    onToggleExpand,
}: DayCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [noteText, setNoteText] = useState(day.notes || "");

    const shots = normalizeShots(day.shots);
    const broll = normalizeBroll(day.broll);

    const completedShots = shots.filter((s) => s.completed).length;
    const completedBroll = broll.filter((b) => b.completed).length;
    const totalItems = shots.length + broll.length;
    const completedItems = completedShots + completedBroll;

    const statusConfig = {
        planned: {
            label: "Planned",
            bg: "bg-stone-100",
            text: "text-stone-600",
            dot: "bg-stone-400",
        },
        filmed: {
            label: "Filmed",
            bg: "bg-blue-50",
            text: "text-blue-700",
            dot: "bg-blue-500",
        },
        edited: {
            label: "Edited",
            bg: "bg-amber-50",
            text: "text-amber-700",
            dot: "bg-amber-500",
        },
        posted: {
            label: "Posted",
            bg: "bg-green-50",
            text: "text-green-700",
            dot: "bg-green-500",
        },
    };

    const pillarConfig = {
        rig: { label: "Rig", bg: "bg-orange-50", text: "text-orange-700" },
        life: { label: "Life", bg: "bg-purple-50", text: "text-purple-700" },
        dog: { label: "Dog", bg: "bg-pink-50", text: "text-pink-700" },
        journey: { label: "Journey", bg: "bg-teal-50", text: "text-teal-700" },
    };

    const vibeIcons = {
        travel: "🚗",
        camp: "🏕️",
        city: "🏙️",
        rest: "💤",
    };

    const toggleShotComplete = (index: number) => {
        const newShots: ShotItem[] = shots.map((shot, i) =>
            i === index ? { ...shot, completed: !shot.completed } : shot,
        );
        onUpdate({ ...day, shots: newShots });
    };

    const toggleBrollComplete = (index: number) => {
        const newBroll: BrollItem[] = broll.map((item, i) =>
            i === index ? { ...item, completed: !item.completed } : item,
        );
        onUpdate({ ...day, broll: newBroll });
    };

    const updateStatus = (status: ContentDay["status"]) => {
        onUpdate({ ...day, status });
    };

    const saveNote = () => {
        onUpdate({ ...day, notes: noteText || undefined });
        setShowNoteInput(false);
    };

    if (isEditing) {
        return (
            <DayEditor
                day={day}
                onSave={(updatedDay) => {
                    onUpdate(updatedDay);
                    setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
            />
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            {/* Compact Header - Always Visible */}
            <div
                className="p-4 cursor-pointer active:bg-stone-50 transition-colors"
                onClick={onToggleExpand}
            >
                <div className="flex items-start gap-3">
                    {/* Day Number Circle */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
                        {day.dayIndex}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">
                                {vibeIcons[day.vibe]}
                            </span>
                            <span className="font-semibold text-stone-900">
                                {formatDisplayDate(day.date)}
                            </span>
                        </div>

                        {day.location && (
                            <p className="text-sm text-stone-500 truncate mb-2">
                                {day.location}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${pillarConfig[day.pillar].bg} ${pillarConfig[day.pillar].text}`}
                            >
                                {pillarConfig[day.pillar].label}
                            </span>
                            <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[day.status].bg} ${statusConfig[day.status].text} flex items-center gap-1.5`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${statusConfig[day.status].dot}`}
                                />
                                {statusConfig[day.status].label}
                            </span>
                            {totalItems > 0 && (
                                <span className="text-xs text-stone-400">
                                    {completedItems}/{totalItems} shots
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Expand Arrow */}
                    <svg
                        className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>

                {/* Hook Preview (when collapsed) */}
                {!isExpanded && day.hook && (
                    <p className="mt-3 text-sm text-stone-600 italic line-clamp-2 pl-15">
                        "{day.hook}"
                    </p>
                )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 animate-fade-in">
                    {/* Hook */}
                    <div className="mb-4 p-3 bg-stone-50 rounded-xl">
                        <p className="text-sm font-medium text-stone-700 mb-1">
                            Hook
                        </p>
                        <p className="text-sm text-stone-900 italic">
                            "{day.hook}"
                        </p>
                    </div>

                    {/* Status Quick Select */}
                    <div className="mb-4">
                        <p className="text-sm font-medium text-stone-700 mb-2">
                            Status
                        </p>
                        <div className="flex gap-2">
                            {(
                                [
                                    "planned",
                                    "filmed",
                                    "edited",
                                    "posted",
                                ] as const
                            ).map((status) => (
                                <button
                                    key={status}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateStatus(status);
                                    }}
                                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                                        day.status === status
                                            ? `${statusConfig[status].bg} ${statusConfig[status].text} ring-2 ring-offset-1 ring-stone-300`
                                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                                    }`}
                                >
                                    {statusConfig[status].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Shots Checklist */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-stone-700">
                                Shots ({completedShots}/{shots.length})
                            </p>
                            {shots.length > 0 && (
                                <div className="h-1.5 w-20 bg-stone-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{
                                            width: `${(completedShots / shots.length) * 100}%`,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            {shots.map((shot, idx) => (
                                <label
                                    key={idx}
                                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                        shot.completed
                                            ? "bg-green-50"
                                            : "bg-stone-50 hover:bg-stone-100"
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        checked={shot.completed}
                                        onChange={() => toggleShotComplete(idx)}
                                        className="mt-0.5 rounded border-stone-300"
                                    />
                                    <span
                                        className={`text-sm flex-1 ${shot.completed ? "text-stone-400 line-through" : "text-stone-700"}`}
                                    >
                                        {shot.text}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* B-Roll Checklist */}
                    {broll.length > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-stone-700">
                                    B-Roll ({completedBroll}/{broll.length})
                                </p>
                                <div className="h-1.5 w-20 bg-stone-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{
                                            width: `${(completedBroll / broll.length) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                {broll.map((item, idx) => (
                                    <label
                                        key={idx}
                                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                            item.completed
                                                ? "bg-green-50"
                                                : "bg-stone-50 hover:bg-stone-100"
                                        }`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={item.completed}
                                            onChange={() =>
                                                toggleBrollComplete(idx)
                                            }
                                            className="mt-0.5 rounded border-stone-300"
                                        />
                                        <span
                                            className={`text-sm flex-1 ${item.completed ? "text-stone-400 line-through" : "text-stone-700"}`}
                                        >
                                            {item.text}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Caption Seed */}
                    <div className="mb-4 p-3 bg-stone-50 rounded-xl">
                        <p className="text-sm font-medium text-stone-700 mb-1">
                            Caption Seed
                        </p>
                        <p className="text-sm text-stone-600">
                            {day.captionSeed}
                        </p>
                    </div>

                    {/* Posting Time */}
                    {day.postingTime && (
                        <div className="mb-4 flex items-center gap-2 text-sm text-stone-500">
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
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Best time to post: {day.postingTime}
                        </div>
                    )}

                    {/* Notes */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-stone-700">
                                Notes
                            </p>
                            {!showNoteInput && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowNoteInput(true);
                                        setNoteText(day.notes || "");
                                    }}
                                    className="text-xs text-orange-600 font-medium hover:text-orange-700"
                                >
                                    {day.notes ? "Edit" : "Add note"}
                                </button>
                            )}
                        </div>

                        {showNoteInput ? (
                            <div onClick={(e) => e.stopPropagation()}>
                                <textarea
                                    value={noteText}
                                    onChange={(e) =>
                                        setNoteText(e.target.value)
                                    }
                                    placeholder="Add notes about this day..."
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all resize-none text-sm"
                                    rows={3}
                                    autoFocus
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={saveNote}
                                        className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setShowNoteInput(false)}
                                        className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : day.notes ? (
                            <p className="text-sm text-stone-600 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                {day.notes}
                            </p>
                        ) : (
                            <p className="text-sm text-stone-400 italic">
                                No notes yet
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-stone-100">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                            className="flex-1 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                            Edit
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRegenerate();
                            }}
                            className="flex-1 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
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
                            Regenerate
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
