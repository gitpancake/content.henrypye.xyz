import { TripProject } from "./types";

const STORAGE_KEY = "shelby4runner.projects.v1";
const DEBOUNCE_DELAY = 500;

let debounceTimer: NodeJS.Timeout | null = null;

export function loadProjects(): TripProject[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const projects = JSON.parse(stored);
    return Array.isArray(projects) ? projects : [];
  } catch (error) {
    console.error("Failed to load projects from localStorage:", error);
    return [];
  }
}

export function saveProjects(projects: TripProject[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save projects to localStorage:", error);
  }
}

export function saveProjectsDebounced(projects: TripProject[]): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  debounceTimer = setTimeout(() => {
    saveProjects(projects);
    debounceTimer = null;
  }, DEBOUNCE_DELAY);
}

export function upsertProject(project: TripProject): void {
  const projects = loadProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  
  if (index >= 0) {
    projects[index] = { ...project, updatedAt: Date.now() };
  } else {
    projects.push({ ...project, createdAt: Date.now(), updatedAt: Date.now() });
  }
  
  saveProjects(projects);
}

export function deleteProject(projectId: string): void {
  const projects = loadProjects();
  const filtered = projects.filter((p) => p.id !== projectId);
  saveProjects(filtered);
}

export function getProject(projectId: string): TripProject | null {
  const projects = loadProjects();
  return projects.find((p) => p.id === projectId) || null;
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