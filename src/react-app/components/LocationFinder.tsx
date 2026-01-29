import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import LocationSelector from './LocationSelector';

export default function LocationFinder() {
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  if (showLocationSelector) {
    return (
      <LocationSelector 
        className="mt-4"
      />
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🏆 Encontre Centros Ambev Próximos
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          Localize os 2 centros de distribuição Ambev mais próximos de você para entrega mais rápida
        </p>
        <button
          onClick={() => setShowLocationSelector(true)}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 mx-auto"
        >
          <Navigation className="w-5 h-5" />
          Localizar Centros Próximos
        </button>
      </div>
    </div>
  );
}
