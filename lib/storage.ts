import { TripProject } from "./types";
import { supabase } from "./supabase";

// Database row type
interface TripProjectRow {
    id: string;
    user_id: string;
    team_id: string;
    title: string;
    start_date: string;
    end_date: string;
    itinerary_text: string;
    route_hints: string | null;
    settings: TripProject["settings"];
    days: TripProject["days"];
    created_at: number;
    updated_at: number;
}

// Convert database row to TripProject
function rowToProject(row: TripProjectRow): TripProject {
    return {
        id: row.id,
        title: row.title,
        startDate: row.start_date,
        endDate: row.end_date,
        itineraryText: row.itinerary_text,
        routeHints: row.route_hints || undefined,
        settings: row.settings,
        days: row.days,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// Convert TripProject to database row
function projectToRow(project: TripProject, teamId: string): Omit<TripProjectRow, "user_id"> & { user_id: string; team_id: string } {
    return {
        id: project.id,
        user_id: "", // Legacy field
        team_id: teamId,
        title: project.title,
        start_date: project.startDate,
        end_date: project.endDate,
        itinerary_text: project.itineraryText,
        route_hints: project.routeHints || null,
        settings: project.settings,
        days: project.days,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
    };
}

export async function loadProjects(teamId: string): Promise<TripProject[]> {
    try {
        const { data, error } = await supabase
            .from("trip_projects")
            .select("*")
            .eq("team_id", teamId)
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("Failed to load projects from Supabase:", error);
            return [];
        }

        return (data || []).map(rowToProject);
    } catch (error) {
        console.error("Failed to load projects:", error);
        return [];
    }
}

export async function saveProject(project: TripProject, teamId: string): Promise<void> {
    try {
        const row = projectToRow(project, teamId);
        const { error } = await supabase
            .from("trip_projects")
            .upsert(row, { onConflict: "id" });

        if (error) {
            console.error("Failed to save project to Supabase:", error);
        }
    } catch (error) {
        console.error("Failed to save project:", error);
    }
}

export async function upsertProject(project: TripProject, teamId: string): Promise<void> {
    const now = Date.now();
    const projectToSave = {
        ...project,
        createdAt: project.createdAt || now,
        updatedAt: now,
    };
    await saveProject(projectToSave, teamId);
}

export async function deleteProject(projectId: string, teamId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from("trip_projects")
            .delete()
            .eq("id", projectId)
            .eq("team_id", teamId);

        if (error) {
            console.error("Failed to delete project from Supabase:", error);
        }
    } catch (error) {
        console.error("Failed to delete project:", error);
    }
}

export async function getProject(
    projectId: string,
    teamId: string,
): Promise<TripProject | null> {
    try {
        const { data, error } = await supabase
            .from("trip_projects")
            .select("*")
            .eq("id", projectId)
            .eq("team_id", teamId)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            console.error("Failed to get project from Supabase:", error);
            return null;
        }

        return data ? rowToProject(data) : null;
    } catch (error) {
        console.error("Failed to get project:", error);
        return null;
    }
}

export function exportProject(project: TripProject): string {
    return JSON.stringify(project, null, 2);
}

export function importProject(jsonString: string): TripProject | null {
    try {
        const project = JSON.parse(jsonString);
        if (!project.id || !project.title || !project.days) {
            throw new Error("Invalid project format");
        }
        return project;
    } catch (error) {
        console.error("Failed to import project:", error);
        return null;
    }
}

export function downloadJson(project: TripProject): void {
    const json = exportProject(project);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.title.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        return false;
    }
}
