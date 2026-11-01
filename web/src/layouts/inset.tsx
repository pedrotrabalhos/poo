import { cn } from "cn";
import type { ReactNode } from "react";

/**
 * The panel every signed-in page renders in, set into the shell chrome by the layout's margins. It owns the
 * scroll, not the window: the chrome stays put and the panel's rounded edges stay visible, and a board that
 * fills the height (`flex-1 min-h-0`) gets a bounded box to scroll its columns in. The ticket dock undoes the
 * `sm:px-6 sm:py-8` padding with negative margins (`ticket-panel.tsx`): change one, change the other.
 *
 * `relative` makes it the containing block of absolutely positioned descendants (`sr-only` labels and file
 * inputs among them): without it they are placed against the viewport at their offset in the scrolled content,
 * and one far down a long page stretches the document past `h-dvh`, scrolling the window behind the panel.
 */
export function Inset({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return (
        <main
            id="main"
            tabIndex={-1}
            className={cn(
                "outline-none relative flex min-h-0 flex-1 flex-col gap-6 overflow-auto rounded-lg border bg-inset px-4 py-6 sm:px-6 sm:py-8",
                className,
            )}
        >
            {children}
        </main>
    );
}
