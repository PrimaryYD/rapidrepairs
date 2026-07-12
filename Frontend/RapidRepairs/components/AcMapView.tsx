import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

export default function AcMapView({
  mapRef,
  style,
  location,
  setLocation,
  getAddressFromCoords,
  technicianLocation,
  destination,
  onRouteUpdate,
}: any) {

  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);


  // Titik 1 (biasanya User)
  const point1 = location;
  // Titik 2 (bisa Teknisi atau Tujuan)
  const point2 = technicianLocation || destination;

  useEffect(() => {
    if (point1?.latitude && point1?.longitude && point2?.latitude && point2?.longitude) {
      fetchRoute(point1, point2);
    } else {
      setRouteCoordinates([]);
      if (onRouteUpdate) onRouteUpdate(null);
    }
  }, [point1?.latitude, point1?.longitude, point2?.latitude, point2?.longitude]);

  const fetchRoute = async (start: any, end: any) => {
    try {
      // OSRM API URL (Free & No Key)
      // Format: lon,lat;lon,lat
      const url = `http://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: any) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRouteCoordinates(coordinates);
        
        if (onRouteUpdate) {
          onRouteUpdate({
            distance: route.distance, // in meters
            duration: route.duration, // in seconds
          });
        }
      }
    } catch (error) {
      console.error("OSRM Fetch Error:", error);
      // Fallback: jika gagal, tampilkan garis lurus saja
      setRouteCoordinates([
        { latitude: start.latitude, longitude: start.longitude },
        { latitude: end.latitude, longitude: end.longitude },
      ]);
      if (onRouteUpdate) onRouteUpdate(null);
    }
  };

  if (Platform.OS === "web") return null;

  return (
    <MapView
      ref={mapRef}
      style={style}
      userInterfaceStyle="dark"
      customMapStyle={darkMapStyle}
      initialRegion={{
        latitude: location?.latitude || -6.2000,
        longitude: location?.longitude || 106.8166,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      onPress={(e: any) => {
        if (!setLocation || !getAddressFromCoords) return;
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setLocation({ latitude, longitude });
        getAddressFromCoords(latitude, longitude);
      }}
    >
      {/* Marker Lokasi User / Utama */}
      {location?.latitude && location?.longitude && (
        <Marker coordinate={location} title="Lokasi" />
      )}

      {/* Marker Teknisi (Jika Ada) */}
      {technicianLocation?.latitude && technicianLocation?.longitude && (
        <Marker 
          coordinate={technicianLocation} 
          title="Teknisi" 
          pinColor="blue"
        />
      )}

      {/* Marker Tujuan (Jika Ada) */}
      {destination?.latitude && destination?.longitude && (
        <Marker 
          coordinate={destination} 
          title="Tujuan" 
          pinColor="green"
        />
      )}

      {/* 🔥 Garis Tracking Jalan (Road-Following) */}
      {routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#8B5E3C" // Warna cokelat premium
          strokeWidth={5}
          lineJoin="round"
        />
      )}
    </MapView>
  );
}

const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#242f3e"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#746855"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#242f3e"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#d59563"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#d59563"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#263c3f"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#6b9a76"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#38414e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#212a37"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9ca5b3"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#746855"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#1f2835"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#f3d19c"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2f3948"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#d59563"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#17263c"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#515c6d"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#17263c"
      }
    ]
  }
];
