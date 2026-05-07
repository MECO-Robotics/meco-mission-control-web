import { IconTasks } from "@/components/shared/Icons";

export function SearchToolbarInput({
  ariaLabel,
  onChange,
  placeholder,
  value,
}: {
  ariaLabel?: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const isActive = value.trim() !== "";

  return (
    <div className={`toolbar-filter toolbar-filter-compact toolbar-search${isActive ? " is-active" : ""}`}>
      <span className="toolbar-filter-icon">
        <IconTasks />
      </span>
      <input
        aria-label={ariaLabel ?? placeholder}
        className="toolbar-search-input"
        onChange={(milestone) => onChange(milestone.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </div>
  );
}
