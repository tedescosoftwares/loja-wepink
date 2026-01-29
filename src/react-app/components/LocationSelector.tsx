import { MapPin, Navigation, Clock, CheckCircle, AlertCircle, Loader, Building2, Globe } from 'lucide-react';
import { useGeolocation } from '@/react-app/hooks/useGeolocation';

interface LocationSelectorProps {
  onLocationSelected?: (center: any) => void;
  className?: string;
}

export default function LocationSelector({ 
  onLocationSelected, 
  className = ""
}: LocationSelectorProps) {
  const { 
    location, 
    error, 
    loading, 
    nearestCenter, 
    allCenters,
    stateCenters, 
    requestLocation, 
    hasPermission,
    detectedState
  } = useGeolocation();

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getDeliveryStatus = () => {
    // Always return available - delivery is always permitted
    return 'available';
  };

  const renderCenter = (center: any, isNearest = false, isStateCenter = false) => {
    const status = getDeliveryStatus();
    
    return (
      <div 
        key={center.id}
        className={`p-4 border rounded-lg transition-all ${
          isStateCenter
            ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
            : isNearest 
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
              : 'border-gray-200 hover:border-gray-300 bg-green-50'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className={`w-5 h-5 ${
              isStateCenter ? 'text-green-600' : isNearest ? 'text-blue-600' : 'text-green-600'
            }`} />
            <h3 className={`font-semibold ${
              isStateCenter ? 'text-green-900' : isNearest ? 'text-blue-900' : 'text-gray-900'
            }`}>
              {center.name}
              {isStateCenter && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">
                  🏆 AMBEV OFICIAL
                </span>
              )}
              {isNearest && !isStateCenter && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  MAIS PRÓXIMO
                </span>
              )}
            </h3>
          </div>
          
          {center.distance_km && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-green-600">
                {formatDistance(center.distance_km)}
              </span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <p className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {center.address}
          </p>
          
          
          
          {center.operating_hours && (
            <p className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {center.operating_hours}
            </p>
          )}

          {status === 'available' && (
            <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded text-green-800 text-xs">
              ✅ <strong>Entrega disponível</strong> - Atendemos toda a região
            </div>
          )}
        </div>

        {onLocationSelected && (
          <button
            onClick={() => onLocationSelected(center)}
            className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Selecionar este Centro
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          Centros de Distribuição Ambev
        </h2>
        <p className="text-gray-600 text-sm">
          {detectedState 
            ? `Centros Ambev no seu estado (${detectedState}) para entrega rápida`
            : 'Encontre o centro Ambev mais próximo de você para entrega mais rápida'
          }
        </p>
      </div>

      {!hasPermission && !location && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Localizar Centro Mais Próximo
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            Permita o acesso à sua localização para encontrarmos o centro de distribuição mais próximo
          </p>
          <button
            onClick={requestLocation}
            disabled={loading}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Obtendo localização...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                Permitir Localização
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Erro na Localização</span>
          </div>
          <p className="text-red-700 text-sm">{error.message}</p>
          <button
            onClick={requestLocation}
            className="mt-3 text-red-600 hover:text-red-800 underline text-sm"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {location && (nearestCenter || stateCenters.length > 0) && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Localização detectada com sucesso!</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700 text-sm">
              <p>📍 Precisão: ±{Math.round(location.accuracy)}m</p>
              {detectedState && (
                <p className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  Estado: {detectedState}
                </p>
              )}
            </div>
          </div>

          {/* Show only 2 most relevant centers */}
          {(() => {
            // Priority logic: State centers first, then nearest overall
            let centersToShow: any[] = [];
            
            // Add state centers first (max 2)
            if (detectedState && stateCenters.length > 0) {
              centersToShow = stateCenters.slice(0, 2);
            }
            
            // If we have less than 2 centers and there's a nearest center that's not already included
            if (centersToShow.length < 2 && nearestCenter && !centersToShow.some(c => c.id === nearestCenter.id)) {
              centersToShow.push(nearestCenter);
            }
            
            // If we still have less than 2 centers, fill with other centers
            if (centersToShow.length < 2) {
              const remainingCenters = allCenters.filter(center => 
                !centersToShow.some(c => c.id === center.id)
              ).slice(0, 2 - centersToShow.length);
              centersToShow = [...centersToShow, ...remainingCenters];
            }
            
            return (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-bold text-green-900">
                    🏆 Centros Ambev Mais Próximos
                  </h3>
                </div>
                <p className="text-green-700 text-sm mb-4">
                  Selecionamos os 2 centros Ambev mais adequados para sua localização
                </p>
                
                <div className="space-y-3">
                  {centersToShow.map((center) => {
                    const isStateCenter = detectedState && stateCenters.some(sc => sc.id === center.id);
                    const isNearest = nearestCenter && center.id === nearestCenter.id;
                    
                    return renderCenter(center, !!(isNearest && !isStateCenter), !!isStateCenter);
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      
    </div>
  );
}
