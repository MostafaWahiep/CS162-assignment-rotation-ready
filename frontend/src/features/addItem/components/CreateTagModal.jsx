import { useState, useRef, useEffect } from "react";

export default function CreateTagModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [valueType, setValueType] = useState("");
  const [value, setValue] = useState("");
  
  const modalRef = useRef(null);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  function handleSubmit() {
    if (!name || !valueType || value === "") return;

    onCreate({
      name,
      value_type: valueType,
      value:
        valueType === "boolean"
          ? value === "true"
          : valueType === "numeric"
          ? Number(value)
          : value,
    });

    setName("");
    setValueType("");
    setValue("");
    onClose();
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl" ref={modalRef}>
        <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{fontFamily: 'Fraunces, serif'}}>
          Create New Tag
        </h2>

        {/* Tag Name */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tag Name</label>
          <input
            className="bg-gray-50 text-gray-800 px-6 py-3 rounded-full w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="Enter tag name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Value Type */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Value Type</label>
          <select
            className="bg-gray-50 text-gray-800 px-6 py-3 rounded-full w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={valueType}
            onChange={(e) => {
              setValueType(e.target.value);
              setValue(""); // reset value when type changes
            }}
          >
            <option value="">Select type</option>
            <option value="text">Text</option>
            <option value="boolean">Boolean</option>
            <option value="numeric">Numeric</option>
          </select>
        </div>

        {/* Value Input — dynamic */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Value</label>

          {valueType === "numeric" && (
            <input
              type="number"
              className="bg-gray-50 text-gray-800 px-6 py-3 rounded-full w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="Enter number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}

          {valueType === "boolean" && (
            <select
              className="bg-gray-50 text-gray-800 px-6 py-3 rounded-full w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            >
              <option value="">Select yes/no</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          )}

          {valueType === "text" && (
            <input
              type="text"
              className="bg-gray-50 text-gray-800 px-6 py-3 rounded-full w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="Enter text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button 
            className="text-gray-600 hover:text-gray-800 px-6 py-2 font-semibold transition-colors" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-colors"
            onClick={handleSubmit}
          >
            Create Tag
          </button>
        </div>
      </div>
    </div>
  );
}


