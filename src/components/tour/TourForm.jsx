import React, { useState } from "react";

// Google Places Autocomplete loader (simple, for demo)
const loadGoogleMapsScript = (apiKey) => {
  if (window.google && window.google.maps) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = resolve;
    document.body.appendChild(script);
  });
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const TourForm = ({ tourForm, onChange, onSubmit, onCancel }) => {
  const [locations, setLocations] = useState(tourForm.locations || [
    { lat: '', lng: '', name: '', order: 1 }
  ]);

  // Handle location name change and autocomplete
  const handleLocationNameChange = (idx, value) => {
    const newLocs = locations.map((loc, i) => i === idx ? { ...loc, name: value } : loc);
    setLocations(newLocs);
    onChange({ target: { name: 'locations', value: newLocs } });
  };

  // Handle place selection from autocomplete
  const handlePlaceSelect = (idx, place) => {
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const name = place.formatted_address || place.name;
    const newLocs = locations.map((loc, i) => i === idx ? { ...loc, lat, lng, name } : loc);
    setLocations(newLocs);
    onChange({ target: { name: 'locations', value: newLocs } });
  };

  // Add new location
  const addLocation = () => {
    setLocations([...locations, { lat: '', lng: '', name: '', order: locations.length + 1 }]);
  };

  // Remove location
  const removeLocation = (idx) => {
    const newLocs = locations.filter((_, i) => i !== idx).map((loc, i) => ({ ...loc, order: i + 1 }));
    setLocations(newLocs);
    onChange({ target: { name: 'locations', value: newLocs } });
  };

  // Google Places Autocomplete setup
  React.useEffect(() => {
    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY).then(() => {
      locations.forEach((loc, idx) => {
        const input = document.getElementById(`location-input-${idx}`);
        if (input && !input._autocomplete) {
          const autocomplete = new window.google.maps.places.Autocomplete(input);
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            handlePlaceSelect(idx, place);
          });
          input._autocomplete = autocomplete;
        }
      });
    });
  }, [locations.length]);

  return (
    <form
      onSubmit={(e) => {
        console.log('🎯 TourForm onSubmit triggered - preventing default and calling parent');
        e.preventDefault(); // Prevent form submission
        onChange({ target: { name: "locations", value: locations } });
        onSubmit(e);
      }}
      className="space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
    >
      <div>
        <label className="block text-lg font-semibold text-gray-800 mb-3">
          Tour Locations
        </label>
        {locations.map((loc, idx) => (
          <div key={idx} className="flex items-center gap-3 mb-3">
            <input
              id={`location-input-${idx}`}
              type="text"
              value={loc.name}
              onChange={(e) => handleLocationNameChange(idx, e.target.value)}
              placeholder={`Location ${idx + 1}`}
              className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              autoComplete="off"
              required
            />
            {locations.length > 1 && (
              <button
                type="button"
                onClick={() => removeLocation(idx)}
                className="text-red-500 hover:text-red-700 font-bold text-2xl"
              >
                &times;
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addLocation}
          className="mt-2 text-purple-600 hover:underline font-semibold"
        >
          + Add Location
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-2">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={tourForm.startDate}
            onChange={onChange}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-2">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={tourForm.endDate}
            onChange={onChange}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            required
          />
        </div>
      </div>
      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          Save Tour
        </button>
      </div>
    </form>
  );
};

export default TourForm;