import React from 'react';
import { View, Text } from 'react-native';

export default function AcMapView({ style, webFallbackStyle }: any) {
  return (
    <View style={[style, webFallbackStyle]}>
      <Text>Map tidak tersedia di web</Text>
      <Text style={{ fontSize: 12, marginTop: 5 }}>
          Gunakan mobile untuk fitur peta
      </Text>
    </View>
  );
}
