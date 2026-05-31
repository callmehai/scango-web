import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import "../styles/Dropdown.css";

export type DropdownOption<T extends string | number> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

type Props<T extends string | number> = {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  placeholder?: string;
  minWidth?: number | string;
  className?: string;
  /** Show a search box at the top of the panel to filter options by label. */
  searchable?: boolean;
  /** Placeholder for the search box (only used when `searchable`). */
  searchPlaceholder?: string;
  /** Text shown when the search filters out every option. */
  noResultsLabel?: string;
};

/** Estimated panel height when computing auto-flip direction. */
const PANEL_HEIGHT_HINT = 320;

/**
 * Custom select dropdown — replaces native `<select>` which renders ugly
 * native chrome differently per OS. Click-outside + ESC close.
 *
 * Pass `searchable` to add a filter box at the top of the panel (useful for
 * long lists such as the language pickers).
 */
export default function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  minWidth,
  className,
  searchable = false,
  searchPlaceholder,
  noResultsLabel,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Reset the filter each time the panel closes; focus the search on open.
  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    if (searchable) {
      // focus after the panel has rendered
      const id = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open, searchable]);

  // Auto-flip: if there isn't enough room below the trigger for the panel,
  // render it above instead (so opening the dropdown never extends page height).
  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < PANEL_HEIGHT_HINT && spaceAbove > spaceBelow) {
      setPlacement("top");
    } else {
      setPlacement("bottom");
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  return (
    <div
      className={`dropdown ${className ?? ""}`}
      ref={rootRef}
      style={minWidth ? { minWidth } : undefined}
    >
      <button
        type="button"
        className="dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span className="dropdown__value">
          {selected ? (
            <>
              {selected.icon && (
                <span className="dropdown__opt-icon">{selected.icon}</span>
              )}
              <span>{selected.label}</span>
            </>
          ) : (
            <span className="dropdown__placeholder">{placeholder ?? ""}</span>
          )}
        </span>
        <svg
          className={`dropdown__caret ${open ? "dropdown__caret--open" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className={`dropdown__panel ${
            placement === "top" ? "dropdown__panel--top" : ""
          }`}
        >
          {searchable && (
            <div className="dropdown__search">
              <svg
                className="dropdown__search-icon"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                className="dropdown__search-input"
                placeholder={searchPlaceholder ?? ""}
                value={query}
                aria-label={searchPlaceholder ?? ariaLabel}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="dropdown__empty">{noResultsLabel ?? "—"}</p>
          ) : (
            <ul className="dropdown__list" role="listbox">
              {filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={String(opt.value)} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`dropdown__option ${
                        isSelected ? "dropdown__option--selected" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      {opt.icon && (
                        <span className="dropdown__opt-icon">{opt.icon}</span>
                      )}
                      <span className="dropdown__opt-label">{opt.label}</span>
                      {isSelected && (
                        <svg
                          className="dropdown__check"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
