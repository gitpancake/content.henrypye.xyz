"use client";

interface ProgressBarProps {
    current: number;
    total: number;
    message?: string;
}

export default function ProgressBar({
    current,
    total,
    message,
}: ProgressBarProps) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className="w-full space-y-3">
            {message && (
                <div className="flex items-center gap-2">
                    <svg
                        className="w-4 h-4 text-orange-500 animate-pulse"
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
                    <p className="text-sm text-stone-600">{message}</p>
                </div>
            )}

            <div className="relative">
                <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {/* Animated shimmer effect */}
                {percentage < 100 && (
                    <div className="absolute inset-0 overflow-hidden rounded-full">
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                            style={{
                                width: "50%",
                                animation: "shimmer 1.5s infinite",
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center text-xs text-stone-500">
                <span>
                    Step {current} of {total}
                </span>
                <span className="font-medium text-orange-600">
                    {percentage}%
                </span>
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(300%);
                    }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    );
}
