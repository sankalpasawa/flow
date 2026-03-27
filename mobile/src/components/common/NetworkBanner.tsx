import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkSync } from '../../hooks/useNetworkState';

export function NetworkBanner() {
  const { isConnected } = useNetworkSync();
  if (isConnected) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Offline — changes will sync when reconnected</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
