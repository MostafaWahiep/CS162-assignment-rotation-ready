import React from "react";

export default function CategoryTag({ categories, selectedCategoryIds, onToggleCategory, currentLocale }) {
    const localeCategoryPalettes = {
        usa: ["#E31B23", "#B71C1C"],        
        china: ["#55B89C", "#21806A"],
        korea: ["#FF7890", "#C2185B"],
        argentina: ["#D9A300", "#A67C00"],
        india: ["#F7A721", "#B8860B"],
        germany: ["#005493", "#00264D"],
    };

    // Helper to determine if text should be dark or light based on background
    const getContrastColor = (hexColor) => {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#1f2937' : '#ffffff';
    };

    const palette = localeCategoryPalettes[currentLocale] || localeCategoryPalettes['usa'];
    const cardColor = palette[0];
    const cardColorSelected = palette[1] || palette[0];
    const textColor = getContrastColor(cardColor);
    const textColorSelected = getContrastColor(cardColorSelected);

    return (
        <div className="mb-8">
            <div className="relative">
                <div className="flex flex-wrap gap-2 pb-2">
                    {categories.map((cat) => {
                        const isSelected = selectedCategoryIds.includes(cat.id);
                        const currentTextColor = isSelected ? textColorSelected : textColor;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => onToggleCategory(cat.id)}
                                className={`
                                    relative rounded-full
                                    flex items-center gap-2
                                    cursor-pointer transition-all duration-150 ease-out
                                    group
                                    px-4 py-2
                                    ${ 
                                        isSelected 
                                            ? 'shadow-md scale-105' 
                                            : 'hover:scale-105 hover:shadow-sm opacity-90 hover:opacity-100'
                                    }
                                `}
                                style={{ 
                                    backgroundColor: isSelected ? cardColorSelected : cardColor,
                                    ringColor: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'transparent'
                                }}
                                aria-label={`Toggle ${cat.name}`}
                                aria-pressed={isSelected}
                            >
                                {/* Selection indicator - small checkmark */}
                                {isSelected && (
                                    <div className="flex-shrink-0 w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center">
                                        <svg 
                                            className="w-3 h-3 text-green-600" 
                                            fill="currentColor" 
                                            viewBox="0 0 20 20"
                                        >
                                            <path 
                                                fillRule="evenodd" 
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                                clipRule="evenodd" 
                                            />
                                        </svg>
                                    </div>
                                )}

                                {/* Category icon */}
                                {cat.image && (
                                    <img 
                                        src={`data:image/png;base64,${cat.image}`}
                                        alt={cat.name}
                                        className="w-5 h-5 object-contain filter drop-shadow-sm flex-shrink-0"
                                    />
                                )}

                                {/* Category name */}
                                <span 
                                    className="text-sm font-semibold whitespace-nowrap"
                                    style={{ color: currentTextColor }}
                                >
                                    {cat.name}
                                </span>

                                {/* Hover effect overlay */}
                                <div className={`
                                    absolute inset-0 rounded-full bg-white opacity-0 
                                    transition-opacity duration-150
                                    ${!isSelected && 'group-hover:opacity-10'}
                                `} />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
