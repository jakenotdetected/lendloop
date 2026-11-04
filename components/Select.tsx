"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  icon?: ReactNode;
};

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  inline = false,
}: {
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  inline?: boolean;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function openList() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function choose(index: number) {
    onChange(options[index].value);
    close();
  }

  function onTriggerKey(event: KeyboardEvent) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openList();
    }
  }

  function onListKey(event: KeyboardEvent) {
    const last = options.length - 1;
    if (event.key === "ArrowDown") setActive((i) => Math.min(last, i + 1));
    else if (event.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(last);
    else if (event.key === "Enter" || event.key === " ") choose(active);
    else if (event.key === "Escape") close();
    else if (event.key === "Tab") setOpen(false);
    else {
      const match = options.findIndex((option) =>
        option.label.toLowerCase().startsWith(event.key.toLowerCase()),
      );
      if (match >= 0) setActive(match);
      return;
    }
    if (event.key !== "Tab") event.preventDefault();
  }

  return (
    <div
      ref={rootRef}
      className={`select ${inline ? "select-inline" : ""} ${open ? "is-open" : ""}`}
    >
      <span className="select-label" id={`${id}-label`}>
        {label}
      </span>
      <div className="select-anchor">
        <button
          ref={triggerRef}
          type="button"
          className="select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label ${id}-value`}
          onClick={() => (open ? close() : openList())}
          onKeyDown={onTriggerKey}
        >
          <span className="select-value">
            {selected?.icon && (
              <span className="select-icon" aria-hidden>
                {selected.icon}
              </span>
            )}
            <span id={`${id}-value`}>{selected?.label}</span>
          </span>
          <svg className="select-chevron" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M5 8l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && (
          <ul
            ref={listRef}
            className="select-list"
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${id}-label`}
            aria-activedescendant={`${id}-option-${active}`}
            onKeyDown={onListKey}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                data-index={index}
                role="option"
                aria-selected={option.value === value}
                className={index === active ? "is-active" : ""}
                onPointerMove={() => setActive(index)}
                onClick={() => choose(index)}
              >
                {option.icon && (
                  <span className="select-icon" aria-hidden>
                    {option.icon}
                  </span>
                )}
                <span className="select-option-text">
                  <span>{option.label}</span>
                  {option.hint && (
                    <span className="select-hint">{option.hint}</span>
                  )}
                </span>
                {option.value === value && (
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      d="M4.5 10.5l3.5 3.5 7.5-8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
