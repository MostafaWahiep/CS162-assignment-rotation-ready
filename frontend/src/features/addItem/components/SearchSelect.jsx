import { useState, useRef, useEffect } from "react";

export default function SearchSelect({ items, displayField, valueField, onSelect, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);

  const filtered = items.filter((item) =>
    item[displayField].toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(item) {
    onSelect(item[valueField]);
    setQuery("");
    setOpen(false);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={selectRef}>
      <input
        className="w-full bg-white text-gray-800 px-6 py-3 rounded-full placeholder-gray-400 shadow-lg"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />

      {open && (
        <div className="absolute mt-1 w-full bg-white text-gray-800 rounded-lg shadow-lg max-h-48 overflow-auto z-20">
          {filtered.length === 0 && (
            <div className="p-2 text-gray-400">No results</div>
          )}

          {filtered.map((item) => (
            <div
              key={item[valueField]}
              className="px-6 py-3 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => handleSelect(item)}
            >
              {item[displayField]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

