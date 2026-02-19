import { useEffect, useMemo, useRef, useState } from 'react';

export type SearchOption = {
  label: string;
  value: string;
};

type SearchDropdownProps = {
  label: string;
  options: SearchOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
};

export default function SearchDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = 'Search...',
}: SearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const displayValue = value ?? query;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options.slice(0, 50);
    return options
      .filter((option) => option.label.toLowerCase().includes(normalized))
      .slice(0, 50);
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;
    const listEl = listRef.current;
    const activeEl = listEl?.querySelector<HTMLButtonElement>(`[data-index=\"${activeIndex}\"]`);
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  const handleSelect = (option: SearchOption) => {
    onChange(option.value);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="search-dropdown">
      <label className="input-label">{label}</label>
      <div className="search-field">
        <input
          className="input"
          value={displayValue}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(null);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
              setIsOpen(true);
              setActiveIndex(0);
              return;
            }
            if (!isOpen) return;

            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((prev) => Math.max(prev - 1, 0));
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              const option = filtered[activeIndex];
              if (option) handleSelect(option);
            }
            if (event.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        />
        <button
          className="button ghost"
          type="button"
          onClick={() => {
            setQuery('');
            onChange(null);
            setIsOpen(false);
            setActiveIndex(0);
          }}
        >
          Clear
        </button>
      </div>
      {isOpen && filtered.length > 0 ? (
        <div className="dropdown-list" ref={listRef}>
          {filtered.map((option, index) => (
            <button
              key={option.value}
              type="button"
              data-index={index}
              className={`dropdown-option${index === activeIndex ? ' active' : ''}`}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
