import { useState, useEffect } from 'react';

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

interface LocationData {
  state: string;
  city: string;
  country: string;
}

interface DistributionCenter {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  operating_hours: string;
  delivery_radius_km: number;
  state_code?: string;
  city?: string;
  region?: string;
  distance_km?: number;
}

interface UseGeolocationReturn {
  location: GeolocationData | null;
  locationData: LocationData | null;
  error: GeolocationError | null;
  loading: boolean;
  nearestCenter: DistributionCenter | null;
  allCenters: DistributionCenter[];
  stateCenters: DistributionCenter[];
  requestLocation: () => void;
  hasPermission: boolean;
  detectedState: string | null;
}

// Brazilian states mapping
const BRAZILIAN_STATES: { [key: string]: string } = {
  'AC': 'Acre',
  'AL': 'Alagoas', 
  'AP': 'Amapá',
  'AM': 'Amazonas',
  'BA': 'Bahia',
  'CE': 'Ceará',
  'DF': 'Distrito Federal',
  'ES': 'Espírito Santo',
  'GO': 'Goiás',
  'MA': 'Maranhão',
  'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais',
  'PA': 'Pará',
  'PB': 'Paraíba',
  'PR': 'Paraná',
  'PE': 'Pernambuco',
  'PI': 'Piauí',
  'RJ': 'Rio de Janeiro',
  'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia',
  'RR': 'Roraima',
  'SC': 'Santa Catarina',
  'SP': 'São Paulo',
  'SE': 'Sergipe',
  'TO': 'Tocantins'
};

// State boundaries (simplified)
const STATE_BOUNDARIES = {
  'SP': { minLat: -25.3, maxLat: -19.8, minLng: -53.1, maxLng: -44.2 },
  'RJ': { minLat: -23.4, maxLat: -20.8, minLng: -44.9, maxLng: -40.9 },
  'MG': { minLat: -22.9, maxLat: -14.2, minLng: -51.1, maxLng: -39.9 },
  'PR': { minLat: -26.7, maxLat: -22.5, minLng: -54.6, maxLng: -48.0 },
  'RS': { minLat: -33.8, maxLat: -27.1, minLng: -57.7, maxLng: -49.7 },
  'SC': { minLat: -29.4, maxLat: -25.9, minLng: -53.8, maxLng: -48.3 },
  'BA': { minLat: -18.3, maxLat: -8.5, minLng: -46.6, maxLng: -37.3 },
  'GO': { minLat: -19.5, maxLat: -12.4, minLng: -53.2, maxLng: -45.9 },
  'PE': { minLat: -9.5, maxLat: -7.3, minLng: -41.4, maxLng: -34.8 },
  'CE': { minLat: -7.9, maxLat: -2.8, minLng: -41.4, maxLng: -37.3 },
  // Add more states as needed
};

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

// Detect state from coordinates
function detectStateFromCoordinates(lat: number, lng: number): string | null {
  for (const [stateCode, bounds] of Object.entries(STATE_BOUNDARIES)) {
    if (lat >= bounds.minLat && lat <= bounds.maxLat && 
        lng >= bounds.minLng && lng <= bounds.maxLng) {
      return stateCode;
    }
  }
  
  // Fallback: find closest state capital
  const stateCapitals = {
    'SP': { lat: -23.5505, lng: -46.6333 },
    'RJ': { lat: -22.9068, lng: -43.1729 },
    'MG': { lat: -19.9167, lng: -43.9345 },
    'PR': { lat: -25.4284, lng: -49.2733 },
    'RS': { lat: -30.0346, lng: -51.2177 },
    'SC': { lat: -27.5954, lng: -48.5480 },
    'BA': { lat: -12.9714, lng: -38.5014 },
    'GO': { lat: -16.6864, lng: -49.2643 },
    'PE': { lat: -8.0476, lng: -34.8770 },
    'CE': { lat: -3.7172, lng: -38.5433 },
  };
  
  let closestState = null;
  let minDistance = Infinity;
  
  for (const [stateCode, capital] of Object.entries(stateCapitals)) {
    const distance = calculateDistance(lat, lng, capital.lat, capital.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestState = stateCode;
    }
  }
  
  return closestState;
}

// Reverse geocoding simulation
async function reverseGeocode(lat: number, lng: number): Promise<LocationData | null> {
  try {
    const detectedState = detectStateFromCoordinates(lat, lng);
    
    if (detectedState) {
      return {
        state: detectedState,
        city: 'Cidade Detectada',
        country: 'BR'
      };
    }
    
    return {
      state: 'SP', // Default to São Paulo
      city: 'São Paulo',
      country: 'BR'
    };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);
  const [nearestCenter, setNearestCenter] = useState<DistributionCenter | null>(null);
  const [allCenters, setAllCenters] = useState<DistributionCenter[]>([]);
  const [stateCenters, setStateCenters] = useState<DistributionCenter[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [detectedState, setDetectedState] = useState<string | null>(null);

  // Fetch distribution centers
  useEffect(() => {
    fetchDistributionCenters();
  }, []);

  // Find nearest center and filter by state when location changes
  useEffect(() => {
    if (location && allCenters.length > 0) {
      processLocationData();
    }
  }, [location, allCenters]);

  // Filter centers by detected state
  useEffect(() => {
    if (detectedState && allCenters.length > 0) {
      const centersInState = allCenters.filter(center => 
        center.state_code === detectedState
      );
      setStateCenters(centersInState);
      
      console.log(`🏛️ Centros Ambev no estado ${detectedState}:`, centersInState.length);
    }
  }, [detectedState, allCenters]);

  const fetchDistributionCenters = async () => {
    try {
      const response = await fetch('/api/distribution-centers');
      const data = await response.json();
      
      if (data.centers) {
        setAllCenters(data.centers);
      }
    } catch (error) {
      console.error('Error fetching distribution centers:', error);
    }
  };

  const processLocationData = async () => {
    if (!location) return;

    // Detect location data
    const locationInfo = await reverseGeocode(location.latitude, location.longitude);
    if (locationInfo) {
      setLocationData(locationInfo);
      setDetectedState(locationInfo.state);
      
      console.log(`🌍 Estado detectado: ${locationInfo.state} (${BRAZILIAN_STATES[locationInfo.state]})`);
    }

    // Find nearest center overall
    const centersWithDistance = allCenters.map(center => ({
      ...center,
      distance_km: calculateDistance(
        location.latitude,
        location.longitude,
        center.latitude,
        center.longitude
      )
    }));

    // Sort by distance and get the nearest
    centersWithDistance.sort((a, b) => a.distance_km! - b.distance_km!);
    const nearest = centersWithDistance[0];

    setNearestCenter(nearest);
    setAllCenters(centersWithDistance);
    
    // Save customer location with state data
    saveCustomerLocation(locationInfo);
  };

  const saveCustomerLocation = async (locationInfo: LocationData | null) => {
    if (!location) return;

    try {
      const sessionId = sessionStorage.getItem('session_id') || 
                      localStorage.getItem('session_id') || 
                      `guest_${Date.now()}`;

      await fetch('/api/customer-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          latitude: location.latitude,
          longitude: location.longitude,
          nearest_center_id: nearestCenter?.id || null,
          distance_to_center_km: nearestCenter?.distance_km || null,
          accuracy: location.accuracy,
          detected_state: locationInfo?.state || null,
          detected_city: locationInfo?.city || null,
          detected_country: locationInfo?.country || null
        }),
      });
    } catch (error) {
      console.error('Error saving customer location:', error);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocalização não é suportada neste navegador'
      });
      return;
    }

    setLoading(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({ latitude, longitude, accuracy });
        setHasPermission(true);
        setLoading(false);
        
        console.log('📍 Localização capturada:', { latitude, longitude, accuracy });
      },
      (error) => {
        setLoading(false);
        
        let errorMessage = 'Erro desconhecido';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo limite para obter localização';
            break;
        }
        
        setError({
          code: error.code,
          message: errorMessage
        });
        
        console.error('Erro de geolocalização:', error);
      },
      options
    );
  };

  return {
    location,
    locationData,
    error,
    loading,
    nearestCenter,
    allCenters,
    stateCenters,
    requestLocation,
    hasPermission,
    detectedState
  };
}
