interface ArchiveFilterCheckboxProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

const CHECKBOX_LABEL_STYLE = {
  alignItems: "center",
  color: "var(--text-copy)",
  display: "inline-flex",
  fontSize: "0.85rem",
  gap: "0.35rem",
} as const;

export function ArchiveFilterCheckbox({ checked, label, onChange }: ArchiveFilterCheckboxProps) {
  return (
    <div className="task-queue-filter-menu-checkboxes">
      <label style={CHECKBOX_LABEL_STYLE}>
        <input
          aria-label={label}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        {label}
      </label>
    </div>
  );
}
