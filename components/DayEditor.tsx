"use client";

import { useState } from "react";
import { ContentDay } from "@/lib/types";

interface DayEditorProps {
  day: ContentDay;
  onSave: (day: ContentDay) => void;
  onCancel: () => void;
}

export default function DayEditor({ day, onSave, onCancel }: DayEditorProps) {
  const [editedDay, setEditedDay] = useState<ContentDay>(day);

  const handleSave = () => {
    const updatedDay = {
      ...editedDay,
      editedFields: [
        ...(editedDay.editedFields || []),
        "location",
        "vibe",
        "pillar",
        "hook",
        "shots",
        "broll",
        "captionSeed",
        "notes",
      ],
    };
    onSave(updatedDay);
  };

  const addShot = () => {
    setEditedDay({
      ...editedDay,
      shots: [...editedDay.shots, ""],
    });
  };

  const removeShot = (index: number) => {
    setEditedDay({
      ...editedDay,
      shots: editedDay.shots.filter((_, i) => i !== index),
    });
  };

  const updateShot = (index: number, value: string) => {
    const newShots = [...editedDay.shots];
    newShots[index] = value;
    setEditedDay({
      ...editedDay,
      shots: newShots,
    });
  };

  const addBroll = () => {
    setEditedDay({
      ...editedDay,
      broll: [...editedDay.broll, ""],
    });
  };

  const removeBroll = (index: number) => {
    setEditedDay({
      ...editedDay,
      broll: editedDay.broll.filter((_, i) => i !== index),
    });
  };

  const updateBroll = (index: number, value: string) => {
    const newBroll = [...editedDay.broll];
    newBroll[index] = value;
    setEditedDay({
      ...editedDay,
      broll: newBroll,
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 space-y-4">
      <h3 className="text-lg font-semibold">
        Edit Day {editedDay.dayIndex}: {editedDay.date}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            value={editedDay.location || ""}
            onChange={(e) =>
              setEditedDay({ ...editedDay, location: e.target.value })
            }
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Vibe</label>
          <select
            value={editedDay.vibe}
            onChange={(e) =>
              setEditedDay({
                ...editedDay,
                vibe: e.target.value as ContentDay["vibe"],
              })
            }
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
          >
            <option value="travel">Travel</option>
            <option value="camp">Camp</option>
            <option value="city">City</option>
            <option value="rest">Rest</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pillar</label>
          <select
            value={editedDay.pillar}
            onChange={(e) =>
              setEditedDay({
                ...editedDay,
                pillar: e.target.value as ContentDay["pillar"],
              })
            }
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
          >
            <option value="rig">Rig</option>
            <option value="life">Life</option>
            <option value="dog">Dog</option>
            <option value="journey">Journey</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Hook</label>
          <input
            type="text"
            value={editedDay.hook}
            onChange={(e) =>
              setEditedDay({ ...editedDay, hook: e.target.value })
            }
            maxLength={120}
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
          />
          <p className="text-xs text-gray-500 mt-1">
            {editedDay.hook.length}/120 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Shot List</label>
          {editedDay.shots.map((shot, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                value={shot}
                onChange={(e) => updateShot(idx, e.target.value)}
                className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
                placeholder="Shot description"
              />
              <button
                onClick={() => removeShot(idx)}
                className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addShot}
            className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Shot
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">B-Roll</label>
          {editedDay.broll.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateBroll(idx, e.target.value)}
                className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
                placeholder="B-roll description"
              />
              <button
                onClick={() => removeBroll(idx)}
                className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addBroll}
            className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add B-Roll
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Caption Seed</label>
          <textarea
            value={editedDay.captionSeed}
            onChange={(e) =>
              setEditedDay({ ...editedDay, captionSeed: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={editedDay.notes || ""}
            onChange={(e) =>
              setEditedDay({ ...editedDay, notes: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}