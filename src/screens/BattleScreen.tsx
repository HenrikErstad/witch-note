import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Placeholder — battle mode implementation to follow.
export default function BattleScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.icon}>{'⚔'}</Text>
      <Text style={styles.title}>Battle mode</Text>
      <Text style={styles.text}>Coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  text: {
    fontSize: 16,
    color: '#8e8e93',
    marginTop: 6,
  },
});
