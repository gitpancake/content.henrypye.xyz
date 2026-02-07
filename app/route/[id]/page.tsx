import { supabase } from "@/lib/supabase";
import { formatDisplayDate } from "@/lib/date";
import { Metadata } from "next";

interface TripProjectRow {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  days: Array<{
    dayIndex: number;
    date: string;
    location?: string;
    vibe: "travel" | "camp" | "city" | "rest";
  }>;
}

async function getProject(id: string): Promise<TripProjectRow | null> {
  const { data, error } = await supabase
    .from("trip_projects")
    .select("id, title, start_date, end_date, days")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return { title: "Route Not Found" };
  }

  return {
    title: `${project.title} - Route`,
    description: `${project.days.length} day road trip itinerary`,
  };
}

const vibeConfig = {
  travel: { icon: "🚗", label: "Travel Day", bg: "bg-blue-50", border: "border-blue-200" },
  camp: { icon: "🏕️", label: "Camping", bg: "bg-green-50", border: "border-green-200" },
  city: { icon: "🏙️", label: "City", bg: "bg-amber-50", border: "border-amber-200" },
  rest: { icon: "💤", label: "Rest Day", bg: "bg-purple-50", border: "border-purple-200" },
};

export default async function PublicRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-stone-900 mb-2">Route not found</h1>
          <p className="text-stone-500">This trip might have been deleted or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");
    const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
    return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">{project.title}</h1>
              <p className="text-sm text-stone-500">{formatDateRange(project.start_date, project.end_date)}</p>
            </div>
          </div>
          <p className="text-stone-600 mt-3">
            {project.days.length} day road trip itinerary
          </p>
        </div>
      </header>

      {/* Route Timeline */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-stone-200" />

          <div className="space-y-4">
            {project.days.map((day, idx) => {
              const vibe = vibeConfig[day.vibe];
              return (
                <div key={day.dayIndex} className="relative pl-16 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                  {/* Timeline dot */}
                  <div className={`absolute left-4 w-5 h-5 rounded-full ${vibe.bg} ${vibe.border} border-2 flex items-center justify-center`}>
                    <div className="w-2 h-2 rounded-full bg-stone-400" />
                  </div>

                  {/* Day card */}
                  <div className={`${vibe.bg} ${vibe.border} border rounded-xl p-4`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{vibe.icon}</span>
                          <span className="font-semibold text-stone-900">Day {day.dayIndex}</span>
                          <span className="text-stone-400">·</span>
                          <span className="text-sm text-stone-600">{formatDisplayDate(day.date)}</span>
                        </div>
                        {day.location && (
                          <p className="text-stone-700 font-medium">{day.location}</p>
                        )}
                      </div>
                      <span className="text-xs text-stone-500 bg-white/50 px-2 py-1 rounded-full">
                        {vibe.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* End marker */}
          <div className="relative pl-16 pt-4">
            <div className="absolute left-4 w-5 h-5 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center">
              <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-stone-500 italic">End of trip</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 mt-12">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center text-sm text-stone-400">
          Shared via Content Calendar
        </div>
      </footer>
    </div>
  );
}
