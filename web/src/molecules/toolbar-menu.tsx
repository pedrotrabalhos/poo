import { Button } from "@/atoms/button";
import * as Icon from "@/icons";
import type { IconComponent } from "@/icons/contract";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "./dropdown-menu";

/**
 * A single choice in a toolbar (sort, group, one filter), as a menu button that names itself: "Sort · Name",
 * sized to its content and as tall as every other toolbar control. While the `unset` option is picked (no app, no
 * grouping) the trigger shows only the label, never a value pretending to be a choice ("All apps"). A form's
 * `Select` never stands in for it: see `interface/DESIGN.md`.
 */
function ToolbarMenu<T extends string>({
    label,
    iconOnly = false,
    icon: Glyph,
    value,
    options,
    onChange,
    unset,
    align = "start",
}: {
    label: string;
    iconOnly?: boolean;
    icon?: IconComponent;
    value: T;
    options: ReadonlyArray<{ id: T; title: string; icon?: IconComponent }>;
    onChange: (value: T) => void;
    /** The option that means "no choice"; the trigger then shows only the label. */
    unset?: T;
    align?: "start" | "end";
}) {
    const current =
        value === unset ? undefined : options.find((o) => o.id === value);
    const hasOptionIcons = options.some((option) => option.icon);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                data-slot="toolbar-menu"
                render={
                    <Button
                        variant="outline"
                        size={iconOnly ? "icon" : "default"}
                        aria-label={iconOnly ? label : undefined}
                        title={iconOnly ? label : undefined}
                    />
                }
            >
                {iconOnly && Glyph ? (
                    <Glyph />
                ) : (
                    <>
                        {Glyph && (
                            <span
                                data-icon="inline-start"
                                className="inline-grid size-4 shrink-0 place-items-center"
                            >
                                <Glyph className="size-4 text-muted-foreground" />
                            </span>
                        )}
                        <span className={current && "text-muted-foreground"}>
                            {label}
                        </span>
                        {current && (
                            <span className="max-w-48 truncate font-semibold">
                                {current.title}
                            </span>
                        )}
                        <Icon.Expand
                            data-icon="inline-end"
                            className="text-muted-foreground"
                        />
                    </>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="min-w-48">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>{label}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                        value={value}
                        onValueChange={(next: T) => onChange(next)}
                    >
                        {options.map((option) => (
                            <DropdownMenuRadioItem
                                key={option.id}
                                value={option.id}
                                // One choice: picking it is the end of the menu's job.
                                closeOnClick
                            >
                                {hasOptionIcons && (
                                    <span className="inline-grid size-4 shrink-0 place-items-center">
                                        {option.icon && (
                                            <option.icon className="size-4 text-muted-foreground" />
                                        )}
                                    </span>
                                )}
                                {option.title}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export { ToolbarMenu };
