"use client";

import { useState } from "react";
import { ContentDay } from "@/lib/types";
import { formatDisplayDate } from "@/lib/date";
import DayEditor from "./DayEditor";

interface DayCardProps {
  day: ContentDay;
  onUpdate: (day: ContentDay) => void;
  onRegenerate: () => void;
}

export default function DayCard({ day, onUpdate, onRegenerate }: DayCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const statusColors = {
    planned: "bg-gray-100 text-gray-700",
    filmed: "bg-blue-100 text-blue-700",
    edited: "bg-yellow-100 text-yellow-700",
    posted: "bg-green-100 text-green-700",
  };

  const pillarColors = {
    rig: "bg-orange-100 text-orange-700",
    life: "bg-purple-100 text-purple-700",
    dog: "bg-pink-100 text-pink-700",
    journey: "bg-teal-100 text-teal-700",
  };

  const vibeIcons = {
    travel: "🚗",
    camp: "🏕️",
    city: "🏙️",
    rest: "💤",
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
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">
              Day {day.dayIndex}: {formatDisplayDate(day.date)}
            </h3>
            <span className="text-2xl">{vibeIcons[day.vibe]}</span>
          </div>
          
          {day.location && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              📍 {day.location}
            </p>
          )}
          
          <div className="flex gap-2 mb-3">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${pillarColors[day.pillar]}`}
            >
              {day.pillar.toUpperCase()}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${statusColors[day.status]}`}
            >
              {day.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={day.status}
            onChange={(e) =>
              onUpdate({
                ...day,
                status: e.target.value as ContentDay["status"],
              })
            }
            className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
          >
            <option value="planned">Planned</option>
            <option value="filmed">Filmed</option>
            <option value="edited">Edited</option>
            <option value="posted">Posted</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Hook
          </h4>
          <p className="text-sm italic">{day.hook}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Shot List
          </h4>
          <ul className="text-sm space-y-1">
            {day.shots.map((shot, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mr-2">📸</span>
                <span>{shot}</span>
              </li>
            ))}
          </ul>
        </div>

        {day.broll.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              B-Roll
            </h4>
            <ul className="text-sm space-y-1">
              {day.broll.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">🎬</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Caption Seed
          </h4>
          <p className="text-sm">{day.captionSeed}</p>
        </div>

        {day.postingTime && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            📅 Posting Time: {day.postingTime}
          </div>
        )}

        {day.notes && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {day.notes}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onRegenerate}
          className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}