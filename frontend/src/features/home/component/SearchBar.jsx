import React, { useState, useEffect, useCallback, useRef } from "react";

// Enhanced search bar with filter controls (distance, condition, hours, price)
export default function SearchBar({ places, locale, onSearchChange, tags, selectedTagIds, onTagsChange, onFilterChange }) {
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    // Structured filters mirroring the Buenos Aires UI
    const [distanceMeters, setDistanceMeters] = useState(1000);
    const [conditions, setConditions] = useState([]); // 'Excellent' | 'Good' | 'Fair'
    const [hours, setHours] = useState([]); // 'Morning' | 'Afternoon' | 'Evening'
    const [prices, setPrices] = useState([]); // 'Budget' | 'Mid-Range' | 'Premium'
    
    const searchRef = useRef(null);
    const filterRef = useRef(null);

    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 200);
        return () => clearTimeout(timer);
    }, [search]);

    const getFilteredSuggestions = useCallback((query) => {
        if (!query.trim()) return [];
        const filtered = places.filter(place =>
            place.name.toLowerCase().includes(query.toLowerCase())
        );
        return [...new Set(filtered.map(place => place.name))].slice(0, 5);
    }, [places]);

    useEffect(() => {
        const newSuggestions = getFilteredSuggestions(debouncedSearch);
        setSuggestions(newSuggestions);
        setShowSuggestions(debouncedSearch.trim() !== "");
        setSelectedIndex(-1);
        onSearchChange(debouncedSearch);
    }, [debouncedSearch, getFilteredSuggestions, onSearchChange]);

    const handleKeyDown = (e) => {
        if (!showSuggestions) {
            if (e.key === 'Enter') setShowSuggestions(false);
            return;
        }

        const actions = {
            ArrowDown: () => setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev),
            ArrowUp: () => setSelectedIndex(prev => prev > 0 ? prev - 1 : -1),
            Tab: () => {
                const index = selectedIndex >= 0 ? selectedIndex : 0;
                setSearch(suggestions[index]);
                setShowSuggestions(false);
            },
            Enter: () => {
                if (selectedIndex >= 0) setSearch(suggestions[selectedIndex]);
                setShowSuggestions(false);
            },
            Escape: () => {
                setShowSuggestions(false);
                setSelectedIndex(-1);
            }
        };

        if (actions[e.key]) {
            e.preventDefault();
            actions[e.key]();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setSearch(suggestion);
        setShowSuggestions(false);
        setSelectedIndex(-1);
    };

    const handleFilterClick = () => {
        setShowFilterMenu(!showFilterMenu);
    };

    const toggleTag = (id) => {
        const newSelectedTagIds = selectedTagIds.includes(id)
            ? selectedTagIds.filter(t => t !== id)
            : [...selectedTagIds, id];
        onTagsChange(newSelectedTagIds);
    };

    const clearTags = () => {
        onTagsChange([]);
    };

    // Notify parent whenever filter changes
    useEffect(() => {
        if (onFilterChange) {
            onFilterChange({
                distanceMeters,
                conditions,
                hours,
                prices,
            });
        }
    }, [distanceMeters, conditions, hours, prices, onFilterChange]);

    const toggleChip = (setter, values, value) => {
        setter(values.includes(value)
            ? values.filter(v => v !== value)
            : [...values, value]
        );
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilterMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex gap-4 mb-6 relative">
            <div className="flex-1 relative" ref={searchRef}>
                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(search.trim() !== "")}
                    className="w-full px-6 py-3 rounded-lg border-none bg-white text-gray-800 text-base shadow-[0_2px_4px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-2 focus:ring-opacity-50"
                />
                {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-lg mt-1 max-h-[300px] overflow-y-auto z-[1000]">
                        {suggestions.length > 0 ? (
                            suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`py-3 px-6 cursor-pointer text-base text-gray-800 transition-colors duration-100 ${
                                        selectedIndex === index ? "bg-gray-100" : "bg-white hover:bg-gray-50"
                                    } ${
                                        index < suggestions.length - 1 ? "border-b border-gray-200" : ""
                                    }`}
                                >
                                    {suggestion}
                                </div>
                            ))
                        ) : (
                            <div className="py-3 px-6 text-base text-gray-800">
                                No results
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div ref={filterRef} className="relative">
            <button 
                onClick={handleFilterClick}
                className="text-white border-none rounded-lg px-6 py-2 text-base font-semibold cursor-pointer transition-colors duration-300 hover:opacity-90"
                style={{ backgroundColor: locale.color }}>
                Filters ▾
            </button>
            {showFilterMenu && (
                <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] p-4 min-w-[320px] z-20">
                    {/* Distance */}
                    <div className="mb-4">
                        <div className="font-bold mb-2 text-gray-800">Distance (m)</div>
                        <div className="px-1">
                            <input
                                type="range"
                                min={0}
                                max={1000}
                                value={distanceMeters}
                                onChange={(e) => setDistanceMeters(Number(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-600 mt-1">
                                <span>0</span>
                                <span>{Math.round(distanceMeters)}</span>
                                <span>1000 m</span>
                            </div>
                        </div>
                    </div>

                    {/* Condition */}
                    <div className="mb-4">
                        <div className="font-bold mb-2 text-gray-800">Condition</div>
                        <div className="flex flex-wrap gap-2">
                            {['Excellent','Good','Fair'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => toggleChip(setConditions, conditions, opt)}
                                    className={`rounded-full px-3 py-1.5 text-sm border cursor-pointer ${
                                        conditions.includes(opt)
                                            ? 'text-white border-transparent'
                                            : 'text-gray-700 border-gray-300 bg-[#f7f7f8]'
                                    }`}
                                    style={conditions.includes(opt) ? { backgroundColor: locale.color } : {}}
                                >{opt}</button>
                            ))}
                        </div>
                    </div>

                    {/* Operating Hours */}
                    <div className="mb-4">
                        <div className="font-bold mb-2 text-gray-800">Operating Hours</div>
                        <div className="flex flex-wrap gap-2">
                            {['Morning','Afternoon','Evening'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => toggleChip(setHours, hours, opt)}
                                    className={`rounded-full px-3 py-1.5 text-sm border cursor-pointer ${
                                        hours.includes(opt)
                                            ? 'text-white border-transparent'
                                            : 'text-gray-700 border-gray-300 bg-[#f7f7f8]'
                                    }`}
                                    style={hours.includes(opt) ? { backgroundColor: locale.color } : {}}
                                >{opt}</button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="mb-4">
                        <div className="font-bold mb-2 text-gray-800">Price Range</div>
                        <div className="flex flex-wrap gap-2">
                            {['Budget','Mid-Range','Premium'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => toggleChip(setPrices, prices, opt)}
                                    className={`rounded-full px-3 py-1.5 text-sm border cursor-pointer ${
                                        prices.includes(opt)
                                            ? 'text-white border-transparent'
                                            : 'text-gray-700 border-gray-300 bg-[#f7f7f8]'
                                    }`}
                                    style={prices.includes(opt) ? { backgroundColor: locale.color } : {}}
                                >{opt}</button>
                            ))}
                        </div>
                    </div>

                    {/* Tags from backend - selectable */}
                    <div className="mb-2">
                        <div className="font-bold mb-2 text-gray-800">Tags</div>
                        <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto">
                            {tags.map(tag => {
                                const isOn = selectedTagIds.includes(tag.id);
                                return (
                                    <button
                                        key={tag.id}
                                        onClick={() => toggleTag(tag.id)}
                                        className={`border rounded-full px-3 py-1.5 text-sm cursor-pointer transition-all duration-200 ${
                                            isOn ? 'border-transparent text-white' : 'border-gray-300 bg-[#f7f7f8] text-[#444]'
                                        }`}
                                        style={isOn ? { backgroundColor: locale.color } : {}}
                                    >
                                        {tag.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-between mt-3">
                        <button 
                            onClick={() => {
                                setDistanceMeters(1000);
                                setConditions([]);
                                setHours([]);
                                setPrices([]);
                                clearTags();
                            }}
                            className="bg-gray-100 border border-gray-300 text-gray-700 rounded-lg px-3.5 py-2 cursor-pointer hover:bg-gray-200">
                            Clear
                        </button>
                        <button 
                            onClick={() => setShowFilterMenu(false)}
                            className="border-none text-white rounded-lg px-3.5 py-2 cursor-pointer font-semibold"
                            style={{ backgroundColor: locale.color }}>
                            Done
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}