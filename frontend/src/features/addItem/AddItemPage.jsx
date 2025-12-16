import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, FieldContent, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Spinner } from "@/shared/components/ui/spinner";
import SearchSelect from "./components/SearchSelect";

import { getCategories } from "@/api/category";
import { getTags } from "@/api/tag";
import { createItem } from "@/api/item";
import { getCurrentUser } from "@/api/user";

import CategoryChip from "./components/CategoryChip";
import TagChip from "./components/TagChip";
import CreateTagModal from "./components/CreateTagModal";
import "@/shared/styles/locale-theme.css";

export default function AddItemPage() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [walkingDistance, setWalkingDistance] = useState("");

  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [existingTagValues, setExistingTagValues] = useState({});

  const [newTags, setNewTags] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLocale, setCurrentLocale] = useState('usa');
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const localeMap = {
    'san francisco': 'usa',
    'taipei': 'china',
    'seoul': 'korea',
    'buenos aires': 'argentina',
    'hyderabad': 'india',
    'berlin': 'germany'
  }
  useEffect(() => {
    async function loadUserLocale() {
      try {
        const user = await getCurrentUser();
        if (user && user.rotation_city) {
          const cityName = user.rotation_city.name?.toLowerCase() || '';
          const newLocale = localeMap[cityName] || 'usa';
          setCurrentLocale(newLocale);
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
      }
    }
    loadUserLocale();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const cat = await getCategories();
        const tg = await getTags();
        setCategories(cat);
        setTags(tg);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load categories and tags");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function addCategory(id) {
    const cat = categories.find((c) => c.category_id === id);
    if (!cat) return;
    setSelectedCategories((prev) => [...prev, cat]);
  }

  function removeCategory(id) {
    setSelectedCategories((prev) => prev.filter((c) => c.category_id !== id));
  }

  function addTag(id) {
    const tag = tags.find((t) => t.tag_id === id);
    if (!tag) return;
    setSelectedTags((prev) => [...prev, tag]);
  }

  function removeTag(id) {
    setExistingTagValues((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    setSelectedTags((prev) => prev.filter((t) => t.tag_id !== id));
  }

  function handleExistingTagValueChange(id, value) {
    setExistingTagValues((prev) => ({ ...prev, [id]: value }));
  }

  function handleCreateNewTag(tagObj) {
    setNewTags((prev) => [...prev, tagObj]);
  }

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
      argentina: '#2a9d8f',
      india: '#ff9505',
      germany: '#007ea7'
    }
    return colorMap[currentLocale] || '#cc0000'
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    
    try {
      const body = {
        name,
        location,
        walking_distance: parseFloat(walkingDistance),

        category_ids: selectedCategories.map((c) => c.category_id),

        existing_tags: selectedTags.map((tag) => ({
          tag_id: tag.tag_id,
          value: existingTagValues[tag.tag_id] || "",
        })),

        new_tags: newTags.map((tag) => ({
          name: tag.name,
          value_type: tag.value_type,
          value: tag.value,
        })),
      };

      await createItem(body);
      alert("Item created!");
      // Reset form
      setName("");
      setLocation("");
      setWalkingDistance("");
      setSelectedCategories([]);
      setSelectedTags([]);
      setExistingTagValues({});
      setNewTags([]);
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to create item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Spinner className="w-10 h-10 text-white" />
      </div>
    );
  }

  return (
    <div className={`locale-container min-h-screen w-full relative flex items-center justify-center ${getLocaleClass()} p-4`}>
      <div className={`locale-overlay absolute inset-0 ${getLocaleClass()}`}></div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl py-4">
        <h1 className="text-white text-4xl font-extrabold leading-tight drop-shadow-md text-center mb-4" style={{fontFamily: 'Fraunces, serif'}}>
          Add Item
        </h1>

        {error && (
          <div className="text-white text-center mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          {/* NAME */}
          <Field>
            <FieldContent>
              <FieldLabel className="text-lg font-semibold text-white">Name</FieldLabel>
              <Input
                type="text"
                placeholder="Item name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
                className="bg-white rounded-full px-6 py-3 text-gray-800 text-lg placeholder-gray-400 shadow-lg"
              />
            </FieldContent>
          </Field>

          {/* LOCATION */}
          <Field>
            <FieldContent>
              <FieldLabel className="text-lg font-semibold text-white">Location</FieldLabel>
              <Input
                type="text"
                placeholder="Location description"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSubmitting}
                required
                className="bg-white rounded-full px-6 py-3 text-gray-800 text-lg placeholder-gray-400 shadow-lg"
              />
            </FieldContent>
          </Field>

          {/* WALKING DISTANCE */}
          <Field>
            <FieldContent>
              <FieldLabel className="text-lg font-semibold text-white">Walking Distance (meters)</FieldLabel>
              <Input
                type="number"
                placeholder="Distance in meters"
                value={walkingDistance}
                onChange={(e) => setWalkingDistance(e.target.value)}
                disabled={isSubmitting}
                className="bg-white rounded-full px-6 py-3 text-gray-800 text-lg placeholder-gray-400 shadow-lg"
              />
            </FieldContent>
          </Field>

          {/* CATEGORIES */}
          <Field>
            <FieldContent>
              <FieldLabel className="text-lg font-semibold text-white">Categories</FieldLabel>
              <SearchSelect
                placeholder="Search categories..."
                items={categories.map((c) => ({
                  id: c.category_id,
                  label: c.category_name,
                }))}
                displayField="label"
                valueField="id"
                onSelect={(id) => addCategory(parseInt(id))}
                selectedItems={selectedCategories.map((c) => c.category_id)}
              />

              <div className="flex flex-wrap gap-2 mt-3">
                {selectedCategories.map((cat) => (
                  <CategoryChip key={cat.category_id} category={cat} onRemove={removeCategory} />
                ))}
              </div>
            </FieldContent>
          </Field>

          {/* TAGS */}
          <Field>
            <FieldContent>
              <FieldLabel className="text-lg font-semibold text-white">Tags</FieldLabel>
              <div className="flex items-center gap-3">
                <SearchSelect
                  placeholder="Search tags..."
                  items={tags.map((t) => ({
                    id: t.tag_id,
                    label: t.name,
                  }))}
                  displayField="label"
                  valueField="id"
                  onSelect={(id) => addTag(parseInt(id))}
                  selectedItems={selectedTags.map((t) => t.tag_id)}
                />
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="w-12 h-12 rounded-full bg-white text-2xl font-bold shadow-lg flex items-center justify-center transition-all flex-shrink-0"
                  style={{ color: getLocaleColor() }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = getLocaleColor(); e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = getLocaleColor(); }}
                  aria-label="Create new tag"
                >
                  +
                </button>
              </div>

              {/* EXISTING TAGS & NEW TAGS */}
              <div className="flex flex-col gap-3 mt-3">
                {selectedTags.map((tag) => (
                  <TagChip
                    key={tag.tag_id}
                    tag={tag}
                    value={existingTagValues[tag.tag_id] || ""}
                    onValueChange={handleExistingTagValueChange}
                    onRemove={removeTag}
                  />
                ))}

                {newTags.map((tag, index) => (
                  <TagChip
                    key={`new-${index}`}
                    tag={tag}
                    value={tag.value}
                    onValueChange={(ignoredId, value) => {
                      const updated = [...newTags];
                      updated[index].value = value;
                      setNewTags(updated);
                    }}
                    onRemove={() => {
                      setNewTags((prev) => prev.filter((_, i) => i !== index));
                    }}
                  />
                ))}
              </div>
            </FieldContent>
          </Field>

          {submitError && (
            <FieldError errors={[{ message: submitError }]} />
          )}

          {/* SUBMIT */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full px-6 py-3 bg-white font-semibold shadow-lg transition-all"
            style={{ color: getLocaleColor() }}
            onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.backgroundColor = getLocaleColor(); e.currentTarget.style.color = 'white'; } }}
            onMouseLeave={(e) => { if (!isSubmitting) { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = getLocaleColor(); } }}
          >
            {isSubmitting && <Spinner className="mr-2" />}
            Create Item
          </Button>
        </form>
      </div>

      {/* MODAL */}
      <CreateTagModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateNewTag}
      />
    </div>
  );
}







