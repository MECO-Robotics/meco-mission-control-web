import { resolveWorkspaceColor, WORKSPACE_COLOR_PALETTE } from "@/features/workspace/shared/model/workspaceColors";

export function WorkspaceColorField({
  label,
  seed,
  value,
  onChange,
}: {
  label: string;
  seed: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const resolvedColor = resolveWorkspaceColor(value, seed);

  return (
    <div className="field modal-wide">
      <span style={{ color: "var(--text-title)" }}>{label}</span>
      <div style={{ display: "grid", gap: "0.65rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <input
            aria-label={label}
            onChange={(milestone) => onChange(milestone.target.value)}
            style={{
              width: "3rem",
              height: "3rem",
              padding: 0,
              border: "1px solid var(--border-base)",
              borderRadius: "0.85rem",
              background: "var(--bg-row-alt)",
              cursor: "pointer",
            }}
            type="color"
            value={resolvedColor}
          />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "2.5rem",
              padding: "0 0.8rem",
              borderRadius: "0.9rem",
              border: "1px solid var(--border-base)",
              background: "var(--bg-row-alt)",
              color: "var(--text-title)",
              fontFamily: "monospace",
              letterSpacing: "0.04em",
            }}
          >
            {resolvedColor}
          </span>
        </div>
        <div style={{ display: "grid", gap: "0.45rem" }}>
          <span style={{ color: "var(--text-copy)", fontSize: "0.82rem" }}>
            Suggested palette
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem" }}>
            {WORKSPACE_COLOR_PALETTE.map((paletteColor) => {
              const isSelected = paletteColor === resolvedColor;
              return (
                <button
                  key={paletteColor}
                  aria-label={`Use ${paletteColor}`}
                  onClick={() => onChange(paletteColor)}
                  style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "999px",
                    border: isSelected
                      ? "2px solid var(--text-title)"
                      : "1px solid rgba(15, 23, 42, 0.12)",
                    background: paletteColor,
                    boxShadow: isSelected
                      ? "0 0 0 2px rgba(255, 255, 255, 0.65)"
                      : "0 0 0 1px rgba(255, 255, 255, 0.38)",
                    cursor: "pointer",
                  }}
                  title={paletteColor}
                  type="button"
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
