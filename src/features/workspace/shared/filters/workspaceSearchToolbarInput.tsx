import { Search } from "lucide-react";
import { type KeyboardEvent, type Ref } from "react";

export function SearchToolbarInput({
  ariaLabel,
  inputRef,
  onChange,
  onSearchIconActivate,
  placeholder,
  value,
}: {
  ariaLabel?: string;
  inputRef?: Ref<HTMLInputElement>;
  onSearchIconActivate?: () => void;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const isActive = value.trim() !== "";
  const icon = (
    <Search size={14} strokeWidth={2} />
  );

  return (
    <div className={`toolbar-filter toolbar-filter-compact toolbar-search${isActive ? " is-active" : ""}`}>
      {onSearchIconActivate ? (
        <button
          aria-label={ariaLabel ?? "Open search"}
          className="toolbar-filter-icon toolbar-filter-icon-button"
          onClick={onSearchIconActivate}
          onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
            if (event.key === "Enter" || event.key === " ") {
              onSearchIconActivate();
            }
          }}
          type="button"
        >
          {icon}
        </button>
      ) : (
        <span className="toolbar-filter-icon">{icon}</span>
      )}
      <input
        aria-label={ariaLabel ?? placeholder}
        className="toolbar-search-input"
        ref={inputRef}
        onChange={(milestone) => onChange(milestone.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </div>
  );
}
