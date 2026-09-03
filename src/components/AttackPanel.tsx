import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ArmyComposition } from '../types/game';

export interface AttackTarget {
  provinceId: number;
  label: string;
  ownerLabel: string;
  ownerColor?: string;
}

export interface QueuedAttack {
  /** индекс в общем (не отфильтрованном по провинции) списке атак хода */
  id: number;
  targetId: number;
  targetLabel: string;
  units: ArmyComposition;
  totalUnits: number;
}

interface AttackPanelProps {
  hasUnitsAvailable: boolean;
  targets: AttackTarget[];
  /** сколько соседей исключено из целей — граница с ними перекрыта горами */
  blockedCount?: number;
  onSend: (targetId: number, fraction: 'all' | 'half') => void;
  queued: QueuedAttack[];
  onRemove: (id: number) => void;
}

export default function AttackPanel({
  hasUnitsAvailable,
  targets,
  blockedCount = 0,
  onSend,
  queued,
  onRemove,
}: AttackPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Атака (соседние провинции)</Text>
      {targets.length === 0 && blockedCount === 0 && <Text style={styles.hint}>Нет соседних провинций.</Text>}
      {blockedCount > 0 && (
        <Text style={styles.hint}>
          {blockedCount === 1 ? 'Ещё 1 граница перекрыта горами' : `Ещё ${blockedCount} границ перекрыто горами`} —
          прямая атака невозможна.
        </Text>
      )}
      {targets.map((target) => (
        <View key={target.provinceId} style={styles.row}>
          <View style={styles.targetInfo}>
            {target.ownerColor && <View style={[styles.swatch, { backgroundColor: target.ownerColor }]} />}
            <Text style={styles.label}>
              {target.label} · {target.ownerLabel}
            </Text>
          </View>
          <View style={styles.controls}>
            <Pressable
              style={[styles.button, !hasUnitsAvailable && styles.buttonDisabled]}
              disabled={!hasUnitsAvailable}
              onPress={() => onSend(target.provinceId, 'half')}
            >
              <Text style={styles.buttonText}>½</Text>
            </Pressable>
            <Pressable
              style={[styles.button, !hasUnitsAvailable && styles.buttonDisabled]}
              disabled={!hasUnitsAvailable}
              onPress={() => onSend(target.provinceId, 'all')}
            >
              <Text style={styles.buttonText}>Все</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {queued.length > 0 && (
        <View style={styles.queuedBlock}>
          <Text style={styles.title}>Запланировано:</Text>
          {queued.map((attack) => (
            <View key={attack.id} style={styles.row}>
              <Text style={styles.label}>
                → {attack.targetLabel}: {attack.totalUnits} юнитов
              </Text>
              <Pressable style={styles.removeButton} onPress={() => onRemove(attack.id)}>
                <Text style={styles.buttonText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
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
  hint: {
    color: '#8a99a8',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    color: '#c7d1db',
    fontSize: 13,
    flexShrink: 1,
  },
  controls: {
    flexDirection: 'row',
    gap: 6,
  },
  button: {
    paddingHorizontal: 10,
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
    fontSize: 13,
  },
  removeButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#5c2c2c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queuedBlock: {
    marginTop: 4,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 6,
  },
});
