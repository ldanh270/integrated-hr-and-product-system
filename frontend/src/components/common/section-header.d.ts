interface SectionHeaderProps {
    title: string;
    action?: React.ReactNode;
    className?: string;
}
/**
 * SectionHeader — Card title row with optional right-side action slot.
 * Provides consistent `border-b` divider and spacing across all cards.
 */
export declare function SectionHeader({ title, action, className }: SectionHeaderProps): import("react/jsx-runtime").JSX.Element;
export {};
