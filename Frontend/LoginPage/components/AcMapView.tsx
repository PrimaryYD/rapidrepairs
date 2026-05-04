import React from "react";
import { Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function AcMapView({
  mapRef,
  style,
  location,
  setLocation,
  getAddressFromCoords,
}: any) {

  if (Platform.OS === "web") return null;

  return (
    <MapView
      ref={mapRef}
      style={style}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      onPress={(e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setLocation({ latitude, longitude });
        getAddressFromCoords(latitude, longitude);
      }}
    >
      <Marker coordinate={location} />
    </MapView>
  );
}