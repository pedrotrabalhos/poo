import { cn } from "cn";
import type * as React from "react";

/**
 * What every page opens with: the title and a one-line description on the left, the page's actions on the right,
 * wrapping under the title on a phone.
 */
function PageHeader({
    title,
    description,
    actions,
    className,
}: {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}) {
    return (
        <header
            data-slot="page-header"
            className={cn(
                "flex flex-wrap items-start justify-between gap-x-6 gap-y-3",
                className,
            )}
        >
            <div className="flex max-w-prose min-w-0 flex-col gap-1">
                <h1 className="text-xl font-semibold tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </header>
    );
}

export { PageHeader };
