import React, { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

const DEFAULT_LATITUDE = -6.2000;
const DEFAULT_LONGITUDE = 106.8166;
const DEFAULT_DELTA = 0.05;

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
  // Track the current visible region in a ref (no state — avoids controlled-prop Polyline bug on iOS)
  const regionRef = useRef({
    latitude: location?.latitude ?? DEFAULT_LATITUDE,
    longitude: location?.longitude ?? DEFAULT_LONGITUDE,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  });

  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);

  const point1 = location;
  const point2 = technicianLocation || destination;

  // When GPS location updates, only re-center if the pin has gone off screen.
  // Uses imperative animateToRegion() so the Polyline is never affected.
  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;

    const r = regionRef.current;
    const latMin = r.latitude - r.latitudeDelta / 2;
    const latMax = r.latitude + r.latitudeDelta / 2;
    const lngMin = r.longitude - r.longitudeDelta / 2;
    const lngMax = r.longitude + r.longitudeDelta / 2;

    const isOnScreen =
      location.latitude >= latMin &&
      location.latitude <= latMax &&
      location.longitude >= lngMin &&
      location.longitude <= lngMax;

    if (!isOnScreen && mapRef?.current) {
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: r.latitudeDelta,
        longitudeDelta: r.longitudeDelta,
      };
      mapRef.current.animateToRegion(newRegion, 400);
      regionRef.current = newRegion;
    }
  }, [location?.latitude, location?.longitude]);

  // Only fit to the route once on first load — subsequent OSRM updates just refresh the line silently
  const hasInitialFitRef = useRef(false);

  const fetchRoute = async (start: any, end: any) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: any) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRouteCoordinates(coordinates);

        // Only fit to the route on the very first load — never again after that
        if (!hasInitialFitRef.current && mapRef?.current) {
          hasInitialFitRef.current = true;
          setTimeout(() => {
            if (mapRef?.current) {
              mapRef.current.fitToCoordinates(
                [
                  { latitude: start.latitude, longitude: start.longitude },
                  { latitude: end.latitude, longitude: end.longitude },
                ],
                { edgePadding: { top: 80, right: 60, bottom: 220, left: 60 }, animated: true }
              );
            }
          }, 1000);
        }

        if (onRouteUpdate) {
          onRouteUpdate({
            distance: route.distance,
            duration: route.duration,
          });
        }
      }
    } catch (error) {
      console.error("OSRM Fetch Error:", error);
      // Keep old routeCoordinates on error so we don't lose the last good route
      // Only set a straight fallback if we have nothing yet
      setRouteCoordinates((prev: any[]) => {
        if (prev.length > 0) return prev;
        return [
          { latitude: start.latitude, longitude: start.longitude },
          { latitude: end.latitude, longitude: end.longitude },
        ];
      });
      if (onRouteUpdate) onRouteUpdate(null);
    }
  };

  useEffect(() => {
    if (point1?.latitude && point1?.longitude && point2?.latitude && point2?.longitude) {
      fetchRoute(point1, point2);
    } else {
      setRouteCoordinates([]);
      if (onRouteUpdate) onRouteUpdate(null);
    }
  }, [point1?.latitude, point1?.longitude, point2?.latitude, point2?.longitude]);

  if (Platform.OS === "web") return null;

  return (
    <MapView
      ref={mapRef}
      style={style}
      userInterfaceStyle="dark"
      customMapStyle={darkMapStyle}
      initialRegion={{
        latitude: location?.latitude ?? DEFAULT_LATITUDE,
        longitude: location?.longitude ?? DEFAULT_LONGITUDE,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
      }}
      onRegionChangeComplete={(newRegion) => {
        regionRef.current = newRegion;
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

      {/* OSRM road-following route */}
      {routeCoordinates.length > 1 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#4DABF7"
          strokeWidth={6}
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
