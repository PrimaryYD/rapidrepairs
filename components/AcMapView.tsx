import React from "react";
import { Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function AcMapView({
  mapRef,
  style,
  location,
  setLocation,
  getAddressFromCoords,
  techLocation,
}: any) {

  if (Platform.OS === "web") return null;

  return (
    <MapView
      ref={mapRef}
      style={style}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
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
      {/* LOKASI CUSTOMER / TARGET */}
      <Marker 
        coordinate={location} 
        title="Lokasi Pelanggan"
        pinColor="red"
      />

      {/* LOKASI TEKNISI (JIKA ADA) */}
      {techLocation && (
        <Marker 
          coordinate={{
            latitude: techLocation.latitude,
            longitude: techLocation.longitude
          }} 
          title="Lokasi Anda"
          pinColor="blue"
        />
      )}
    </MapView>
  );
}