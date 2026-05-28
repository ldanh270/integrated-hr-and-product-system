type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";
interface StatusPillProps {
    label: string;
    variant?: StatusVariant;
    className?: string;
}
/**
 * StatusPill — Semantic colored pill badge for status labels.
 * Use instead of raw `rounded-full bg-xxx px-x py-x text-xxx` spans.
 */
export declare function StatusPill({ label, variant, className }: StatusPillProps): import("react/jsx-runtime").JSX.Element;
export {};
