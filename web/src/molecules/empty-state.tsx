import { cn } from "cn";
import type * as React from "react";
import type { IconComponent } from "@/icons/contract";

/** The dashed box shown where a list has nothing yet: a glyph, what is missing, and usually how to add it. */
function EmptyState({
    icon: Glyph,
    title,
    description,
    action,
    className,
}: {
    icon: IconComponent;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            data-slot="empty-state"
            className={cn(
                "grid place-items-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center",
                className,
            )}
        >
            <Glyph className="size-6 text-muted-foreground" />
            <p className="font-medium">{title}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
                {description}
            </p>
            {action && <div className="pt-2">{action}</div>}
        </div>
    );
}

export { EmptyState };
