import { StyleSheet, Text, View } from 'react-native';

import type { PlayerInfo } from '../types/game';

interface PlayerHudProps {
  players: PlayerInfo[];
  currentRound: number;
}

// TODO: per-player province/troop totals once map state is wired in.
export default function PlayerHud({ players, currentRound }: PlayerHudProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.round}>Раунд {currentRound}</Text>
      {players.map((player) => (
        <View key={player.uid} style={styles.player}>
          <View style={[styles.swatch, { backgroundColor: player.color }]} />
          <Text style={styles.name}>{player.name}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
  },
  round: {
    color: '#fff',
    fontWeight: '700',
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  name: {
    color: '#fff',
  },
});
