import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "cn";
import type * as React from "react";

/** A row of navigation tabs that scrolls sideways (scrollbar hidden) when it outgrows the screen. */
function TabBar({ className, ...props }: React.ComponentProps<"nav">) {
    return (
        <nav
            data-slot="tab-bar"
            className={cn(
                "flex h-10 [scrollbar-width:none] items-center overflow-x-auto",
                className,
            )}
            {...props}
        />
    );
}

/**
 * One tab, underlined while active. Pass the router link through `render` (`render={<Link to="/" />}`): the link
 * sets `aria-current="page"` when active, which is what the underline keys on.
 */
function TabItem({
    icon,
    className,
    children,
    render,
    ...props
}: useRender.ComponentProps<"a"> & { icon?: React.ReactNode }) {
    return useRender({
        defaultTagName: "a",
        render,
        props: mergeProps<"a">(
            {
                className: cn(
                    "flex h-full shrink-0 items-center gap-1.5 rounded-t-md border-b-2 border-transparent px-3.5 text-[13px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset aria-[current=page]:border-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground [&_svg]:size-4 [&_svg]:shrink-0",
                    className,
                ),
                children: (
                    <>
                        {icon}
                        {children}
                    </>
                ),
            },
            props,
        ),
        state: { slot: "tab-item" },
    });
}

export { TabBar, TabItem };
