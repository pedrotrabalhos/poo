import { cn } from "cn";
import * as Icon from "@/icons";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "./input-group";

/**
 * A toolbar's text search: the magnifier, the field and a clear button once something is typed; Esc clears it too.
 * It only reports changes; the page keeps the text (usually through `useQueryParam`, which writes it to the URL).
 */
function SearchField({
    label,
    value,
    onChange,
    className,
}: {
    /** What is searched, for the placeholder and the field's name ("tickets"). */
    label: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <InputGroup
            data-slot="search-field"
            className={cn("w-full sm:w-64", className)}
        >
            <InputGroupAddon>
                <Icon.Search />
            </InputGroupAddon>
            <InputGroupInput
                type="search"
                aria-label={`Buscar ${label}`}
                // The field has its own clear button; the browser's would be a second one.
                className="[&::-webkit-search-cancel-button]:appearance-none"
                placeholder={`Buscar ${label}`}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Escape" && value) {
                        event.preventDefault();
                        onChange("");
                    }
                }}
            />
            {value && (
                <InputGroupAddon align="inline-end">
                    <InputGroupButton
                        size="icon-xs"
                        aria-label="Limpar busca"
                        onClick={() => onChange("")}
                    >
                        <Icon.Close />
                    </InputGroupButton>
                </InputGroupAddon>
            )}
        </InputGroup>
    );
}

export { SearchField };
