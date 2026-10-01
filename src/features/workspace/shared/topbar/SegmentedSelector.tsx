import { useEffect, useRef, useState, type FocusEvent } from "react";

export interface SegmentedSelectorOption<Value extends string> {
  id: Value;
  label: string;
}

export function SegmentedSelector<Value extends string>({
  ariaLabel,
  collapsible = false,
  dataTutorialTarget,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  collapsible?: boolean;
  dataTutorialTarget?: string;
  onChange: (value: Value) => void;
  options: SegmentedSelectorOption<Value>[];
  value: Value;
}) {
  const [expanded, setExpanded] = useState(!collapsible);
  const rootRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const focusSelectedOptionRef = useRef(false);
  const selectedOption = options.find((option) => option.id === value) ?? options[0];

  useEffect(() => {
    if (!expanded || !focusSelectedOptionRef.current) return;
    focusSelectedOptionRef.current = false;
    rootRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
  }, [expanded]);

  const expandForKeyboard = () => {
    if (collapsible && !expanded) {
      focusSelectedOptionRef.current = true;
      setExpanded(true);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    if (!hoveredRef.current && collapsible) setExpanded(false);
  };

  const showOptions = expanded || !collapsible;

  return (
    <div
      aria-label={ariaLabel}
      className={`timeline-interval-toggle-rail topbar-segmented-selector${showOptions ? " is-expanded" : " is-collapsed"}`}
      data-tutorial-target={dataTutorialTarget}
      onBlurCapture={handleBlur}
      onFocusCapture={expandForKeyboard}
      onMouseEnter={() => {
        hoveredRef.current = true;
        if (collapsible) setExpanded(true);
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
        if (collapsible && !rootRef.current?.contains(document.activeElement)) setExpanded(false);
      }}
      ref={rootRef}
      role="group"
    >
      {showOptions
        ? options.map((option) => (
            <button
              key={option.id}
              aria-pressed={value === option.id}
              className={`timeline-interval-toggle-option${value === option.id ? " is-active" : ""}`}
              onClick={() => {
                onChange(option.id);
                if (collapsible) setExpanded(false);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))
        : selectedOption
          ? (
              <button
                aria-label={`${ariaLabel}: ${selectedOption.label}`}
                aria-expanded={false}
                aria-pressed="true"
                className="timeline-interval-toggle-option is-active"
                onClick={() => setExpanded(true)}
                type="button"
              >
                {selectedOption.label}
              </button>
            )
          : null}
    </div>
  );
}
