export function SearchBox({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="search">
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle
          cx="10.5"
          cy="10.5"
          r="6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M15.5 15.5 21 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
      {value && (
        <button
          type="button"
          className="search-clear"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export function matches(
  query: string,
  ...fields: (string | undefined)[]
): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}
