import { cn } from "cn";
import type { ReactNode } from "react";
import { TabBar } from "@/organisms/tab-bar";
import { Inset } from "./inset";

/**
 * Two-level header: the wordmark and account actions on top, the navigation tabs below, with the page in an
 * inset panel. Everything is inset by the same gutter (`px-2 sm:px-6`) rather than centred in a fixed column:
 * boards and documents are wide, and a capped column wastes the screen.
 */
export function HeaderLayout({
    brand,
    actions,
    tabs,
    children,
}: {
    brand: ReactNode;
    actions: ReactNode;
    tabs: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="flex h-dvh flex-col bg-background texture-noise text-foreground">
            <ShellHeader brand={brand} actions={actions} tabs={tabs} />
            <Inset className="mx-2 mb-2 sm:mx-6 sm:mb-6">{children}</Inset>
        </div>
    );
}

/**
 * The two header rows on their own; the sidebar layout reuses them on screens too narrow for the rail. Pages
 * outside an organization have nothing to navigate between, so with no `tabs` the second row is left out.
 */
export function ShellHeader({
    brand,
    actions,
    tabs,
    className,
}: {
    brand: ReactNode;
    actions: ReactNode;
    tabs: ReactNode;
    className?: string;
}) {
    return (
        <header className={cn("shrink-0 px-2 sm:px-6", className)}>
            <div className="flex h-12 items-center gap-2 px-2 sm:px-6">
                {brand}
                <div className="ml-auto flex items-center gap-2">{actions}</div>
            </div>
            {tabs && (
                <TabBar aria-label="Navegação principal" className="px-2 sm:px-6">
                    {tabs}
                </TabBar>
            )}
        </header>
    );
}
