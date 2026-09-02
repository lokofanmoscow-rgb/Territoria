import { useMemo, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AttackPanel, { type AttackTarget, type QueuedAttack } from '../components/AttackPanel';
import MapSvg, { type ProvinceOwnership } from '../components/MapSvg';
import PlayerHud from '../components/PlayerHud';
import ReinforcementPanel from '../components/ReinforcementPanel';
import ZoomPanMap from '../components/ZoomPanMap';
import { getMapData } from '../assets/maps';
import { PLAYER_COLORS } from '../constants/playerColors';
import { UNIT_TYPE_IDS, UNIT_TYPES, type UnitType } from '../constants/unitTypes';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { resolveRound, STARTING_GOLD, totalUnits } from '../services/gameLogic';
import type { ArmyComposition, AttackMove, PlayerInfo, PlayerPendingMove, ProvinceState } from '../types/game';
import type { MapData } from '../types/map';
import { getBiome } from '../utils/biome';
import { parseViewBox } from '../utils/geometry';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

// Локальный интерактивный прототип: один человек ("Вы") против двух
// "соперников", которые в этой демке просто ничего не делают в свой ход
// (ИИ — отдельная система, не входит в этот проход). Реальные rooms/{roomId}
// через roomsApi ещё не подключены — этот экран проверяет, что resolveRound()
// (экономика + типы юнитов + бой) реально работает и управляем с UI.
const DEMO_MAP_NAME = 'small_02';
const HUMAN_UID = 'you';
const STARTING_GARRISON: ArmyComposition = { infantry: 3 };

function buildInitialGameState(map: MapData): {
  provinces: Record<number, ProvinceState>;
  players: PlayerInfo[];
} {
  const demoPlayers: PlayerInfo[] = [
    { uid: HUMAN_UID, name: 'Вы', color: PLAYER_COLORS[0], isReady: true, gold: STARTING_GOLD },
    { uid: 'rival1', name: 'Соперник 1', color: PLAYER_COLORS[1], isReady: true, gold: STARTING_GOLD },
    { uid: 'rival2', name: 'Соперник 2', color: PLAYER_COLORS[2], isReady: true, gold: STARTING_GOLD },
  ];

  const provinces: Record<number, ProvinceState> = {};
  map.provinces.forEach((province) => {
    provinces[province.id] = { ownerId: null, units: {} };
  });
  map.regions.slice(0, demoPlayers.length).forEach((region, index) => {
    const owner = demoPlayers[index];
    region.provinceIds.forEach((provinceId) => {
      provinces[provinceId] = { ownerId: owner.uid, units: { ...STARTING_GARRISON } };
    });
  });

  return { provinces, players: demoPlayers };
}

export default function GameScreen({ navigation }: Props) {
  const mapData = useMemo(() => getMapData(DEMO_MAP_NAME), []);
  const initial = useMemo(() => buildInitialGameState(mapData), [mapData]);
  const { width: mapWidth, height: mapHeight } = parseViewBox(mapData.viewBox);

  const [provinces, setProvinces] = useState(initial.provinces);
  const [players, setPlayers] = useState(initial.players);
  const [currentRound, setCurrentRound] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pendingReinforcements, setPendingReinforcements] = useState<Record<number, ArmyComposition>>({});
  const [pendingAttacks, setPendingAttacks] = useState<AttackMove[]>([]);

  const humanPlayer = players.find((p) => p.uid === HUMAN_UID)!;

  const reinforcementCost = useMemo(() => {
    let total = 0;
    for (const composition of Object.values(pendingReinforcements)) {
      for (const type of UNIT_TYPE_IDS) {
        total += (composition[type] ?? 0) * UNIT_TYPES[type].cost;
      }
    }
    return total;
  }, [pendingReinforcements]);

  const goldAvailable = (humanPlayer.gold ?? 0) - reinforcementCost;

  const provinceOwners = useMemo(() => {
    const result: Record<number, ProvinceOwnership> = {};
    for (const [idStr, state] of Object.entries(provinces)) {
      if (!state.ownerId) continue;
      const owner = players.find((p) => p.uid === state.ownerId);
      if (!owner) continue;
      result[Number(idStr)] = { color: owner.color, units: state.units };
    }
    return result;
  }, [provinces, players]);

  const selectedProvince = selectedId !== null ? mapData.provinces.find((p) => p.id === selectedId) : undefined;
  const selectedState = selectedId !== null ? provinces[selectedId] : undefined;
  const selectedBiome = selectedProvince ? getBiome(selectedProvince, mapData) : null;
  const isOwnProvince = selectedState?.ownerId === HUMAN_UID;

  function getAvailableUnits(provinceId: number): ArmyComposition {
    const state = provinces[provinceId];
    if (!state) return {};
    const committed: ArmyComposition = {};
    for (const attack of pendingAttacks) {
      if (attack.from !== provinceId) continue;
      for (const type of UNIT_TYPE_IDS) {
        committed[type] = (committed[type] ?? 0) + (attack.units[type] ?? 0);
      }
    }
    const available: ArmyComposition = {};
    for (const type of UNIT_TYPE_IDS) {
      const remain = (state.units[type] ?? 0) - (committed[type] ?? 0);
      if (remain > 0) available[type] = remain;
    }
    return available;
  }

  const availableFromSelected = selectedId !== null ? getAvailableUnits(selectedId) : {};

  const attackTargets: AttackTarget[] = selectedProvince
    ? selectedProvince.neighbors.map((neighborId) => {
        const neighborState = provinces[neighborId];
        const owner = neighborState?.ownerId ? players.find((p) => p.uid === neighborState.ownerId) : undefined;
        return {
          provinceId: neighborId,
          label: `№${neighborId}`,
          ownerLabel: owner ? owner.name : 'Ничья',
          ownerColor: owner?.color,
        };
      })
    : [];

  const queuedFromSelected: QueuedAttack[] = pendingAttacks
    .map((attack, id) => ({ attack, id }))
    .filter(({ attack }) => attack.from === selectedId)
    .map(({ attack, id }) => ({
      id,
      targetId: attack.to,
      targetLabel: `№${attack.to}`,
      units: attack.units,
      totalUnits: totalUnits(attack.units),
    }));

  function handleReinforcementChange(type: UnitType, delta: number) {
    if (selectedId === null) return;
    setPendingReinforcements((prev) => {
      const current = prev[selectedId] ?? {};
      const nextCount = Math.max(0, (current[type] ?? 0) + delta);
      const nextComposition = { ...current, [type]: nextCount };
      if (nextCount === 0) delete nextComposition[type];

      const next = { ...prev };
      if (Object.keys(nextComposition).length === 0) {
        delete next[selectedId];
      } else {
        next[selectedId] = nextComposition;
      }
      return next;
    });
  }

  function handleSendAttack(targetId: number, fraction: 'all' | 'half') {
    if (selectedId === null) return;
    const available = getAvailableUnits(selectedId);
    const units: ArmyComposition = {};
    for (const type of UNIT_TYPE_IDS) {
      const count = available[type] ?? 0;
      const sendCount = fraction === 'all' ? count : Math.floor(count / 2);
      if (sendCount > 0) units[type] = sendCount;
    }
    if (totalUnits(units) <= 0) return;
    setPendingAttacks((prev) => [...prev, { from: selectedId, to: targetId, units }]);
  }

  function handleRemoveAttack(id: number) {
    setPendingAttacks((prev) => prev.filter((_, index) => index !== id));
  }

  function handleEndTurn() {
    const pendingMoves: Record<string, PlayerPendingMove> = {
      [HUMAN_UID]: { reinforcements: pendingReinforcements, attacks: pendingAttacks, submitted: true },
    };
    for (const p of players) {
      if (p.uid === HUMAN_UID) continue;
      pendingMoves[p.uid] = { reinforcements: {}, attacks: [], submitted: true };
    }

    const result = resolveRound({ provinces, regions: mapData.regions, players, pendingMoves });

    setProvinces(result.provinces);
    setPlayers(result.players);
    setCurrentRound((round) => round + 1);
    setPendingReinforcements({});
    setPendingAttacks([]);
    setSelectedId(null);

    if (result.winnerId) {
      const winner = result.players.find((p) => p.uid === result.winnerId);
      navigation.navigate('GameResult', { roomId: 'demo', winnerName: winner?.name });
    }
  }

  return (
    <View style={styles.container}>
      <PlayerHud players={players} currentRound={currentRound} />

      <ZoomPanMap contentWidth={mapWidth} contentHeight={mapHeight}>
        <MapSvg
          map={mapData}
          provinceOwners={provinceOwners}
          selectedProvinceId={selectedId}
          onProvincePress={setSelectedId}
        />
      </ZoomPanMap>

      {selectedProvince && selectedBiome && (
        <ScrollView style={styles.infoPanel} contentContainerStyle={styles.infoPanelContent}>
          <Text style={styles.infoTitle}>
            Провинция {selectedProvince.id} · {selectedBiome.label}
          </Text>
          <Text style={styles.infoText}>
            {selectedState?.ownerId
              ? `Владелец: ${players.find((p) => p.uid === selectedState.ownerId)?.name ?? selectedState.ownerId}`
              : 'Ничейная территория'}
            {' · '}
            Войска: {totalUnits(selectedState?.units ?? {})}
          </Text>

          {isOwnProvince && (
            <>
              <ReinforcementPanel
                goldAvailable={goldAvailable}
                staged={pendingReinforcements[selectedId!] ?? {}}
                onChange={handleReinforcementChange}
              />
              <AttackPanel
                hasUnitsAvailable={totalUnits(availableFromSelected) > 0}
                targets={attackTargets}
                onSend={handleSendAttack}
                queued={queuedFromSelected}
                onRemove={handleRemoveAttack}
              />
            </>
          )}
        </ScrollView>
      )}

      <Button title="Завершить ход" onPress={handleEndTurn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101820',
  },
  infoPanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 64,
    maxHeight: 340,
    backgroundColor: 'rgba(16, 24, 32, 0.92)',
    borderRadius: 10,
  },
  infoPanelContent: {
    padding: 12,
    gap: 10,
  },
  infoTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  infoText: {
    color: '#c7d1db',
    fontSize: 13,
  },
});
