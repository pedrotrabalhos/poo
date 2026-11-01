import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";
import { useLayoutEffect, useRef } from "react";

const textareaVariants = cva(
    "flex field-sizing-content w-full rounded-lg border bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    {
        variants: {
            variant: {
                default:
                    "min-h-16 border-input dark:bg-input/30 dark:disabled:bg-input/80",
                // Text edited in place: looks like the page until hovered or focused, and grows with its content.
                autosize:
                    "max-h-[60dvh] min-h-9 resize-none overflow-auto border-transparent hover:border-input",
            },
        },
        defaultVariants: { variant: "default" },
    },
);

// `field-sizing: content` is not everywhere yet; without it the autosize variant sizes itself from its content.
const NATIVE_AUTOSIZE =
    typeof CSS !== "undefined" && CSS.supports("field-sizing", "content");

function Textarea({
    className,
    variant = "default",
    ref,
    ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
    const own = useRef<HTMLTextAreaElement | null>(null);
    // biome-ignore lint/correctness/useExhaustiveDependencies: resizes on every change of the text it holds
    useLayoutEffect(() => {
        const element = own.current;
        if (variant !== "autosize" || NATIVE_AUTOSIZE || !element) return;
        element.style.height = "auto";
        element.style.height = `${element.scrollHeight}px`;
    }, [variant, props.value]);

    return (
        <textarea
            data-slot="textarea"
            ref={(element) => {
                own.current = element;
                if (typeof ref === "function") ref(element);
                else if (ref) ref.current = element;
            }}
            className={cn(textareaVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Textarea, textareaVariants };
