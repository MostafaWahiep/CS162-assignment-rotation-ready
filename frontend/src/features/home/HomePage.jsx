import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../api/user";
import { apiFetch } from "../../api";
import "@/shared/styles/locale-theme.css";
import CategoryTag from "./component/category_tag";
import SearchBar from "./component/SearchBar";
import { verifyItem } from "../../api/verification";



// Locale-based category palettes (from provided swatches)
const localeCategoryPalettes = {
    usa: ["#E31B23", "#9A2623", "#5C2A28", "#E53935", "#A63A3A"],
    china: ["#2c6e49", "#4c956c", "#fefee3", "#ffc9b9", "#d68c45"],
    korea: ["#f9dbbd", "#ffa5ab", "#da627d", "#a53860", "#450920"],
    argentina: ["#D9A300", "#F7A721", "#E5B74A", "#C8922E", "#B47F21"],
    india: ["#cc5803", "#e2711d", "#ff9505", "#ffb627", "#ffc971"],
    germany: ["#003459", "#007ea7", "#00a8e8", "#ffedd8"],
};

const iconMap = [
    "🏠", "🏛️", "🍽️", "🛒", "☕", "📖", "💊", "🚚", "🔗"
];

function HomePage() {
    const [categories, setCategories] = useState([]);
    const [places, setPlaces] = useState([]);
    const [tags, setTags] = useState([]);
    const [search, setSearch] = useState("");
    const [filteredPlaces, setFilteredPlaces] = useState([]);
    const [view, setView] = useState("list");
    const [currentLocale, setCurrentLocale] = useState('usa');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        distanceMeters: 1000,
        conditions: [],
        hours: [],
        prices: [],
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch current user
                const user = await getCurrentUser();
                console.log("User data from backend:", user);
                
                // Set user name from first_name and last_name
                const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                setUserName(fullName || user.email || "User");
                setUserFirstName(user.first_name || "");
                setUserProfilePic(user.profile_picture || null);

                // Map rotation city id to locale - get city_id from rotation_city object
                const cityName = user.rotation_city?.name?.toLowerCase() || '';
                console.log("Extracted city name:", cityName);
                // Map based on city name to locale
                const localeMap = {
                    'san francisco': 'usa',
                    'taipei': 'china',
                    'seoul': 'korea',
                    'buenos aires': 'argentina',
                    'hyderabad': 'india',
                    'berlin': 'germany'
                };
                const selectedLocale = localeMap[cityName] || 'usa';
                console.log("Selected locale:", selectedLocale);
                setCurrentLocale(selectedLocale);

                // Fetch categories with images
                const cats = await apiFetch("/category/", { method: "GET" });
                setCategories(cats.map(c => ({ 
                    id: c.category_id, 
                    name: c.category_name,
                    image: c.category_pic // base64 image data
                })));

                // Fetch items for user's rotation city
                const items = await apiFetch("/item/", { method: "GET" });
                console.log("Items from backend:", items);
                setPlaces(items.map(item => {
                    const tags = item.tags || [];
                    const findTagValue = (tagName) => {
                        const t = tags.find(tt => (tt.name || tt.tag_name || '').toLowerCase() === tagName.toLowerCase());
                        return t ? (t.value ?? t.name_val ?? t.tag_value ?? t.value_text ?? t.value_name) : undefined;
                    };
                    const condition = findTagValue('Condition');
                    const priceRange = findTagValue('Price Range') || findTagValue('Price');
                    // Operating hours may be text values; allow any of Morning/Afternoon/Evening
                    const hoursText = findTagValue('Operating Hours') || findTagValue('Hours');
                    return ({
                        id: item.item_id,
                        name: item.name,
                        address: item.location,
                        distanceMeters: typeof item.walking_distance === 'number' ? Math.round(item.walking_distance) : undefined,
                        distance: item.walking_distance ? (item.walking_distance / 1000).toFixed(1) : null,
                        tags: tags.map(t => t.name || t.tag_name),
                        verifiedCount: item.number_of_verifications || 0,
                        lastVerified: item.last_verified_date ? new Date(item.last_verified_date).toLocaleDateString() : (item.created_at ? new Date(item.created_at).toLocaleDateString() : null),
                        priceLevel: priceRange === 'Premium' ? 3 : priceRange === 'Mid-Range' ? 2 : 1,
                        priceRange,
                        condition,
                        hours: hoursText,
                        categories: (item.categories || []).map(c => ({ id: c.category_id, name: c.category_name })),
                    });
                }));

                // Fetch tags from backend
                const tagList = await apiFetch("/tag/", { method: "GET" });
                setTags(tagList.map(t => ({ id: t.tag_id, name: t.name || t.tag_name })));
            } catch (e) {
                console.error(e);
            }
        };
        loadData();
    }, []);

    // Locale is set from backend and remains stable for the session

    const handleVerify = async (itemId) => {
        try {
            await verifyItem(itemId);

            // optimistic UI update — NO refetch
            setPlaces(prev =>
                prev.map(p =>
                    p.id === itemId
                        ? { ...p, verifiedCount: (p.verifiedCount || 0) + 1 }
                        : p
                )
            );
        } catch (e) {
            alert("You already verified today or an error occurred.");
        }
    };

    useEffect(() => {
        const bySearch = (p) => p.name.toLowerCase().includes(search.toLowerCase());
        const byCategory = (p) => selectedCategoryIds.length === 0 || (p.categories || []).some(c => selectedCategoryIds.includes(c.id));
        const selectedTagNames = selectedTagIds
            .map(id => (tags.find(t => t.id === id)?.name || "").toLowerCase())
            .filter(Boolean);
        const byTags = (p) => selectedTagNames.length === 0 || selectedTagNames.some(tag => (p.tags || []).map(t => t.toLowerCase()).includes(tag));

        const byDistance = (p) => {
            if (!filters || typeof filters.distanceMeters !== 'number') return true;
            if (typeof p.distanceMeters !== 'number') return true; // if missing, don't exclude
            return p.distanceMeters <= filters.distanceMeters;
        };

        const byCondition = (p) => {
            if (!filters.conditions || filters.conditions.length === 0) return true;
            const val = (p.condition || '').toString();
            return val && filters.conditions.some(c => c.toLowerCase() === val.toLowerCase());
        };

        const byHours = (p) => {
            if (!filters.hours || filters.hours.length === 0) return true;
            const val = (p.hours || '').toString().toLowerCase();
            return filters.hours.some(h => val.includes(h.toLowerCase()));
        };

        const byPrice = (p) => {
            if (!filters.prices || filters.prices.length === 0) return true;
            const val = (p.priceRange || '').toString();
            return val && filters.prices.some(pr => pr.toLowerCase() === val.toLowerCase());
        };

        setFilteredPlaces(
            places.filter(p => bySearch(p) && byCategory(p) && byTags(p) && byDistance(p) && byCondition(p) && byHours(p) && byPrice(p))
        );
    }, [search, places, selectedCategoryIds, selectedTagIds, tags, filters]);

    const toggleTag = (id) => {
        setSelectedTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    const toggleCategory = (id) => {
        setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };
    const getLocaleClass = () => {
        const classMap = {
            usa: 'show-photo',
            china: 'transition-green',
            korea: 'transition-korea',
            argentina: 'transition-argentina',
            india: 'transition-india',
            germany: 'transition-germany'
        }
        return classMap[currentLocale] || 'show-photo'
    }

    const getLocaleColor = () => {
        const colorMap = {
            usa: '#cc0000',
            china: '#2c6e49',
            korea: '#da627d',
            // Use BA palette accent for buttons: 2a9d8f
            argentina: '#2a9d8f',
            india: '#ff9505',
            germany: '#007ea7'
        }
        return colorMap[currentLocale] || '#cc0000'
    }

    const [userName, setUserName] = useState("User");
    const [userFirstName, setUserFirstName] = useState("");
    const [userProfilePic, setUserProfilePic] = useState(null);

    const getLocaleText = () => {
        const textMap = {
            usa: 'Welcome',
            china: '欢迎',
            korea: '어서 오세요',
            argentina: 'Bienvenido',
            india: 'స్వాగతం',
            germany: 'Willkommen'
        };
        return textMap[currentLocale] || 'Welcome';
    };

    return (
        <div style={{ paddingBottom: "2rem" }}>
            <div className={`locale-container ${getLocaleClass()}`} style={{ color: "white", padding: "3rem 2rem 2rem 2rem", position: "relative" }}>
                <div className={`locale-overlay absolute inset-0 ${getLocaleClass()}`}></div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10 }}>
                    <h1 style={{ fontSize: "2.5rem", margin: 0, fontWeight: 300, letterSpacing: "1px", fontFamily: 'Fraunces, serif' }}>
                        {getLocaleText()} {userFirstName}
                    </h1>
                    {userProfilePic && (
                        <div style={{ 
                            width: "60px", 
                            height: "60px", 
                            borderRadius: "50%", 
                            border: "3px solid white",
                            overflow: "hidden",
                            flexShrink: 0
                        }}>
                            <img 
                                src={userProfilePic} 
                                alt="Profile" 
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        </div>
                    )}
                    {!userProfilePic && (
                        <div style={{ 
                            width: "60px", 
                            height: "60px", 
                            borderRadius: "50%", 
                            border: "3px solid white",
                            background: "rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                            flexShrink: 0
                        }}>
                            👤
                        </div>
                    )}
                </div>
            </div>
            <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
                <SearchBar 
                    places={places}
                    locale={{ color: getLocaleColor() }}
                    onSearchChange={setSearch}
                    tags={tags}
                    selectedTagIds={selectedTagIds}
                    onTagsChange={setSelectedTagIds}
                    onFilterChange={setFilters}
                />
                {/* Category Tags Component */}
                <CategoryTag 
                    categories={categories}
                    selectedCategoryIds={selectedCategoryIds}
                    onToggleCategory={toggleCategory}
                    currentLocale={currentLocale}
                />
               
            <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>All Places <span style={{ color: "#999" }}>({filteredPlaces.length})</span></h3>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button
                        onClick={() => setView("list")}
                        style={{
                            background: view === "list" ? getLocaleColor() : "#fff",
                            color: view === "list" ? "#fff" : "#999",
                            border: "1px solid #ddd", borderRadius: 8, padding: 8,
                            cursor: "pointer", fontSize: "0.9rem", width: 36, height: 36,
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                        ☰
                    </button>
                    <button
                        onClick={() => setView("grid")}
                        style={{
                            background: view === "grid" ? getLocaleColor() : "#fff",
                            color: view === "grid" ? "#fff" : "#999",
                            border: "1px solid #ddd", borderRadius: 8, padding: 8,
                            cursor: "pointer", fontSize: "0.9rem", width: 36, height: 36,
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                        ▦
                    </button>
                </div>
            </div>
            <div style={{ display: view === "grid" ? "grid" : "block", gridTemplateColumns: view === "grid" ? "repeat(auto-fill, minmax(280px, 1fr))" : "none", gap: "1.5rem" }}>
                {filteredPlaces.map(place => (
                    <div key={place.id}
                        style={{
                            background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            padding: 20, marginBottom: view === "list" ? 16 : 0, display: "flex", flexDirection: view === "list" ? "row" : "column", alignItems: view === "list" ? "flex-start" : "flex-start", gap: 16
                        }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: 4 }}>{place.name}</div>
                            <div style={{ color: "#666", fontSize: "0.9rem", margin: "4px 0 8px 0", display: "flex", alignItems: "center", gap: 4 }}>
                                📍 {place.address} {place.distance && `${place.distance} km away`}
                            </div>
                            {/* Quick badges from tags */}
                            <div style={{ margin: "8px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {place.tags && place.tags.map((tag, i) => (
                                    <span key={i} style={{
                                        background: "#eee",
                                        color: "#333",
                                        borderRadius: 4, padding: "3px 8px", fontSize: "0.75rem", fontWeight: 500
                                    }}>{tag}</span>
                                ))}
                            </div>
                            {/* Structured meta */}
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                                {place.condition && (
                                    <span style={{ background: "#eef2ff", color: "#333", border: "1px solid #d0d7ff", borderRadius: 6, padding: "6px 10px", fontSize: "0.8rem" }}>
                                        Condition: <strong>{place.condition}</strong>
                                    </span>
                                )}
                                {typeof place.distanceMeters === 'number' && (
                                    <span style={{ background: "#f8f9fa", color: "#333", border: "1px solid #e1e5ea", borderRadius: 6, padding: "6px 10px", fontSize: "0.8rem" }}>
                                        Distance (meters): <strong>{place.distanceMeters}</strong>
                                    </span>
                                )}
                                {place.hours && (
                                    <span style={{ background: "#fff7ed", color: "#7a4b00", border: "1px solid #ffd8a8", borderRadius: 6, padding: "6px 10px", fontSize: "0.8rem" }}>
                                        Hours: <strong>{place.hours}</strong>
                                    </span>
                                )}
                                {place.priceRange && (
                                    <span style={{ background: "#f0fff4", color: "#1f7a1f", border: "1px solid #c6f6d5", borderRadius: 6, padding: "6px 10px", fontSize: "0.8rem" }}>
                                        Price: <strong>{place.priceRange}</strong>
                                    </span>
                                )}
                            </div>
                            <div style={{ color: "#4caf50", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
                                <span>✓ {place.verifiedCount || 0} verified</span>
                                <span style={{ color: "#999", fontSize: "0.85rem" }}>
                                    🕐 {place.lastVerified || "N/A"}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: view === "list" ? "flex-end" : "stretch", flexShrink: 0, width: view === "list" ? "auto" : "100%" }}>
                            <div style={{ color: "#999", fontWeight: 600, fontSize: "1rem", minWidth: 40, textAlign: view === "list" ? "right" : "left" }}>
                                {"$".repeat(place.priceLevel || 1)}
                            </div>
                            <button 
                                onClick={() => navigate(`/item/${place.id}`)}
                                style={{
                                background: getLocaleColor(), color: "#fff", border: "none",
                                borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: "0.85rem",
                                cursor: "pointer", transition: "background 0.3s", width: view === "list" ? "auto" : "100%"
                            }}>
                                View Details
                            </button>
                            <button 
                                onClick={() => handleVerify(place.id)}
                                style={{
                                    background: "#4caf50", color: "#fff", border: "none",
                                    borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: "0.85rem",
                                    cursor: "pointer", width: view === "list" ? "auto" : "100%"
                                }}>
                                Verify
                            </button>

                        </div>
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
}

export default HomePage;