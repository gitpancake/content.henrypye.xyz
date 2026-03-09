"use client";

import {
    useEffect,
    useState,
    useCallback,
    createContext,
    useContext,
} from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    actions,
}: ModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-5 pb-3">
                    <h3 className="text-lg font-semibold text-stone-900">
                        {title}
                    </h3>
                </div>

                {/* Content */}
                <div className="px-5 pb-5">{children}</div>

                {/* Actions */}
                {actions && (
                    <div className="px-5 pb-5 flex gap-3">{actions}</div>
                )}
            </div>
        </div>
    );
}

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: "primary" | "danger";
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmVariant = "primary",
}: ConfirmModalProps) {
    const confirmStyles =
        confirmVariant === "danger"
            ? "bg-red-500 hover:bg-red-600 shadow-red-500/25"
            : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/25";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            actions={
                <>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 py-3 text-white rounded-xl font-medium transition-colors shadow-lg ${confirmStyles}`}
                    >
                        {confirmText}
                    </button>
                </>
            }
        >
            <p className="text-stone-600">{message}</p>
        </Modal>
    );
}

interface RegenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRegenerate: (force: boolean) => void;
}

export function RegenerateModal({
    isOpen,
    onClose,
    onRegenerate,
}: RegenerateModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Regenerate Content"
            actions={
                <div className="flex flex-col w-full gap-2">
                    <button
                        onClick={() => {
                            onRegenerate(true);
                            onClose();
                        }}
                        className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25"
                    >
                        Replace All Content
                    </button>
                    <button
                        onClick={() => {
                            onRegenerate(false);
                            onClose();
                        }}
                        className="w-full py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                    >
                        Keep My Edits
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-stone-500 text-sm font-medium hover:text-stone-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            }
        >
            <p className="text-stone-600 mb-3">
                This day has manual edits. How would you like to regenerate?
            </p>
            <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">●</span>
                    <span className="text-stone-600">
                        <strong>Replace All</strong> — Get fresh AI suggestions
                        for everything
                    </span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-stone-400 mt-0.5">●</span>
                    <span className="text-stone-600">
                        <strong>Keep Edits</strong> — Only update fields you
                        haven't changed
                    </span>
                </div>
            </div>
        </Modal>
    );
}

// Alert Modal for error messages
interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    variant?: "error" | "info";
}

export function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    variant = "error",
}: AlertModalProps) {
    const iconStyles =
        variant === "error"
            ? "bg-red-100 text-red-600"
            : "bg-blue-100 text-blue-600";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            actions={
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
                >
                    OK
                </button>
            }
        >
            <div className="flex gap-3">
                <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconStyles}`}
                >
                    {variant === "error" ? (
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
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    ) : (
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
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    )}
                </div>
                <p className="text-stone-600 pt-2">{message}</p>
            </div>
        </Modal>
    );
}

// Toast notifications
interface Toast {
    id: string;
    message: string;
    variant: "success" | "error" | "info";
}

interface ToastContextType {
    showToast: (message: string, variant?: Toast["variant"]) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback(
        (message: string, variant: Toast["variant"] = "success") => {
            const id = Math.random().toString(36).slice(2);
            setToasts((prev) => [...prev, { id, message, variant }]);

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 3000);
        },
        [],
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast container */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onDismiss={() =>
                            setToasts((prev) =>
                                prev.filter((t) => t.id !== toast.id),
                            )
                        }
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({
    toast,
    onDismiss,
}: {
    toast: Toast;
    onDismiss: () => void;
}) {
    const variantStyles = {
        success: "bg-green-600 text-white",
        error: "bg-red-600 text-white",
        info: "bg-stone-800 text-white",
    };

    const icons = {
        success: (
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
                    d="M5 13l4 4L19 7"
                />
            </svg>
        ),
        error: (
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
                    d="M6 18L18 6M6 6l12 12"
                />
            </svg>
        ),
        info: (
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
    };

    return (
        <div
            className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up pointer-events-auto ${variantStyles[toast.variant]}`}
            onClick={onDismiss}
        >
            {icons[toast.variant]}
            <span className="font-medium text-sm">{toast.message}</span>
        </div>
    );
}
