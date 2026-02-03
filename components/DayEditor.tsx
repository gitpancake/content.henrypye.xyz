"use client";

import { useState } from "react";
import {
    ContentDay,
    normalizeShots,
    normalizeBroll,
    ShotItem,
    BrollItem,
} from "@/lib/types";

interface DayEditorProps {
    day: ContentDay;
    onSave: (day: ContentDay) => void;
    onCancel: () => void;
}

export default function DayEditor({ day, onSave, onCancel }: DayEditorProps) {
    const [location, setLocation] = useState(day.location || "");
    const [vibe, setVibe] = useState(day.vibe);
    const [pillar, setPillar] = useState(day.pillar);
    const [hook, setHook] = useState(day.hook);
    const [shots, setShots] = useState<ShotItem[]>(normalizeShots(day.shots));
    const [broll, setBroll] = useState<BrollItem[]>(normalizeBroll(day.broll));
    const [captionSeed, setCaptionSeed] = useState(day.captionSeed);
    const [notes, setNotes] = useState(day.notes || "");

    const handleSave = () => {
        const updatedDay: ContentDay = {
            ...day,
            location: location || undefined,
            vibe,
            pillar,
            hook,
            shots: shots.filter((s) => s.text.trim()),
            broll: broll.filter((b) => b.text.trim()),
            captionSeed,
            notes: notes || undefined,
            editedFields: [
                ...(day.editedFields || []),
                "location",
                "vibe",
                "pillar",
                "hook",
                "shots",
                "broll",
                "captionSeed",
                "notes",
            ].filter((v, i, a) => a.indexOf(v) === i), // dedupe
        };
        onSave(updatedDay);
    };

    const addShot = () => setShots([...shots, { text: "", completed: false }]);
    const removeShot = (index: number) =>
        setShots(shots.filter((_, i) => i !== index));
    const updateShot = (index: number, text: string) => {
        const newShots = [...shots];
        newShots[index] = { ...newShots[index], text };
        setShots(newShots);
    };

    const addBroll = () => setBroll([...broll, { text: "", completed: false }]);
    const removeBroll = (index: number) =>
        setBroll(broll.filter((_, i) => i !== index));
    const updateBroll = (index: number, text: string) => {
        const newBroll = [...broll];
        newBroll[index] = { ...newBroll[index], text };
        setBroll(newBroll);
    };

    const vibeOptions = [
        { value: "travel", label: "Travel", icon: "🚗" },
        { value: "camp", label: "Camp", icon: "🏕️" },
        { value: "city", label: "City", icon: "🏙️" },
        { value: "rest", label: "Rest", icon: "💤" },
    ];

    const pillarOptions = [
        {
            value: "rig",
            label: "Rig",
            color: "bg-orange-100 text-orange-700 border-orange-200",
        },
        {
            value: "life",
            label: "Life",
            color: "bg-purple-100 text-purple-700 border-purple-200",
        },
        {
            value: "dog",
            label: "Dog",
            color: "bg-pink-100 text-pink-700 border-pink-200",
        },
        {
            value: "journey",
            label: "Journey",
            color: "bg-teal-100 text-teal-700 border-teal-200",
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={onCancel}
                    className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                    <svg
                        className="w-5 h-5 text-stone-600"
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
                <h3 className="font-semibold text-stone-900">
                    Edit Day {day.dayIndex}
                </h3>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                    Save
                </button>
            </div>

            <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        Location
                    </label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Where are you this day?"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                </div>

                {/* Vibe */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        Vibe
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {vibeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                    setVibe(option.value as ContentDay["vibe"])
                                }
                                className={`py-3 rounded-xl text-center transition-all ${
                                    vibe === option.value
                                        ? "bg-orange-100 border-2 border-orange-400 text-orange-700"
                                        : "bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100"
                                }`}
                            >
                                <span className="text-xl block mb-1">
                                    {option.icon}
                                </span>
                                <span className="text-xs font-medium">
                                    {option.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pillar */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        Content Pillar
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {pillarOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                    setPillar(
                                        option.value as ContentDay["pillar"],
                                    )
                                }
                                className={`py-3 px-4 rounded-xl text-center text-sm font-medium transition-all border-2 ${
                                    pillar === option.value
                                        ? option.color
                                        : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hook */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-stone-700">
                            Hook
                        </label>
                        <span
                            className={`text-xs ${hook.length > 120 ? "text-red-500" : "text-stone-400"}`}
                        >
                            {hook.length}/120
                        </span>
                    </div>
                    <input
                        type="text"
                        value={hook}
                        onChange={(e) => setHook(e.target.value)}
                        maxLength={150}
                        placeholder="Your attention-grabbing hook..."
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                </div>

                {/* Shots */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-stone-700">
                            Shot List
                        </label>
                        <button
                            type="button"
                            onClick={addShot}
                            className="text-xs text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1"
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
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Add
                        </button>
                    </div>
                    <div className="space-y-2">
                        {shots.map((shot, idx) => (
                            <div
                                key={idx}
                                className="flex gap-2 animate-slide-in"
                            >
                                <input
                                    type="text"
                                    value={shot.text}
                                    onChange={(e) =>
                                        updateShot(idx, e.target.value)
                                    }
                                    placeholder={`Shot ${idx + 1}`}
                                    className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeShot(idx)}
                                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
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
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    {shots.length === 0 && (
                        <p className="text-sm text-stone-400 text-center py-4">
                            No shots yet. Add your first shot.
                        </p>
                    )}
                </div>

                {/* B-Roll */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-stone-700">
                            B-Roll
                        </label>
                        <button
                            type="button"
                            onClick={addBroll}
                            className="text-xs text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1"
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
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Add
                        </button>
                    </div>
                    <div className="space-y-2">
                        {broll.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex gap-2 animate-slide-in"
                            >
                                <input
                                    type="text"
                                    value={item.text}
                                    onChange={(e) =>
                                        updateBroll(idx, e.target.value)
                                    }
                                    placeholder={`B-roll ${idx + 1}`}
                                    className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeBroll(idx)}
                                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
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
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    {broll.length === 0 && (
                        <p className="text-sm text-stone-400 text-center py-4">
                            No B-roll yet.
                        </p>
                    )}
                </div>

                {/* Caption Seed */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        Caption Seed
                    </label>
                    <textarea
                        value={captionSeed}
                        onChange={(e) => setCaptionSeed(e.target.value)}
                        rows={3}
                        placeholder="Starting point for your caption..."
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Personal notes about this day..."
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                    />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-stone-100 p-4 flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
}
