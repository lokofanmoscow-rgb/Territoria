import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UNIT_TYPE_LIST, type UnitType } from '../constants/unitTypes';
import type { ArmyComposition } from '../types/game';

interface ReinforcementPanelProps {
  /** золото, ещё не потраченное на найм в этом ходу (по всем провинциям) */
  goldAvailable: number;
  /** уже заказанные юниты именно в этой провинции */
  staged: ArmyComposition;
  onChange: (type: UnitType, delta: number) => void;
}

export default function ReinforcementPanel({ goldAvailable, staged, onChange }: ReinforcementPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Найм</Text>
      {UNIT_TYPE_LIST.map((unit) => {
        const count = staged[unit.id] ?? 0;
        const canAfford = goldAvailable >= unit.cost;

        return (
          <View key={unit.id} style={styles.row}>
            <Text style={styles.label}>
              {unit.label} · {unit.cost}💰
            </Text>
            <View style={styles.controls}>
              <Pressable
                style={[styles.button, count === 0 && styles.buttonDisabled]}
                disabled={count === 0}
                onPress={() => onChange(unit.id, -1)}
              >
                <Text style={styles.buttonText}>-</Text>
              </Pressable>
              <Text style={styles.count}>{count}</Text>
              <Pressable
                style={[styles.button, !canAfford && styles.buttonDisabled]}
                disabled={!canAfford}
                onPress={() => onChange(unit.id, 1)}
              >
                <Text style={styles.buttonText}>+</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
      <Text style={styles.gold}>Осталось золота: {goldAvailable}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#c7d1db',
    fontSize: 13,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#2c3a48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 18,
  },
  count: {
    color: '#fff',
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'center',
  },
  gold: {
    color: '#e0b03c',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
