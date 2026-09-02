import { StyleSheet, Text, View } from 'react-native';

import type { AttackMove } from '../types/game';

interface AttackPanelProps {
  attacks: AttackMove[];
}

// TODO: pick from/to province (adjacent only), troop count slider, add/remove attack.
export default function AttackPanel({ attacks }: AttackPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Запланировано атак: {attacks.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  text: {
    color: '#fff',
  },
});
