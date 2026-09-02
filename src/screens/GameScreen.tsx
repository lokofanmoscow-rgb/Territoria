import { useMemo, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/RootNavigator';
import MapSvg, { type ProvinceOwnership } from '../components/MapSvg';
import { getMapData } from '../assets/maps';
import { PLAYER_COLORS } from '../constants/playerColors';
import type { MapData } from '../types/map';
import { getBiome } from '../utils/biome';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const DEMO_PLAYER_COUNT = 3;

// TODO: заменить на реальные данные из rooms/{roomId}.map.provinces (roomsApi ещё
// не подключён — это только чтобы увидеть, как карта выглядит с владельцами).
function buildDemoOwnership(map: MapData): Record<number, ProvinceOwnership> {
  const ownership: Record<number, ProvinceOwnership> = {};
  map.regions.slice(0, DEMO_PLAYER_COUNT).forEach((region, playerIndex) => {
    region.provinceIds.forEach((provinceId) => {
      ownership[provinceId] = { color: PLAYER_COLORS[playerIndex], troops: 1 + (provinceId % 5) };
    });
  });
  return ownership;
}

export default function GameScreen({ route, navigation }: Props) {
  const { roomId } = route.params;
  const mapData = useMemo(() => getMapData('medium_01'), []);
  const provinceOwners = useMemo(() => buildDemoOwnership(mapData), [mapData]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedProvince = mapData.provinces.find((p) => p.id === selectedId) ?? null;
  const selectedBiome = selectedProvince ? getBiome(selectedProvince, mapData) : null;
  const selectedOwnership = selectedId !== null ? provinceOwners[selectedId] : undefined;

  return (
    <View style={styles.container}>
      <MapSvg
        map={mapData}
        provinceOwners={provinceOwners}
        selectedProvinceId={selectedId}
        onProvincePress={setSelectedId}
      />

      {selectedProvince && selectedBiome && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoTitle}>
            Провинция {selectedProvince.id} · {selectedBiome.label}
          </Text>
          <Text style={styles.infoText}>
            {selectedOwnership ? `Войска: ${selectedOwnership.troops}` : 'Ничейная территория'}
          </Text>
          <Text style={styles.infoText}>Соседей: {selectedProvince.neighbors.length}</Text>
        </View>
      )}

      <Button title="Завершить ход" onPress={() => navigation.navigate('GameResult', { roomId })} />
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
    backgroundColor: 'rgba(16, 24, 32, 0.85)',
    borderRadius: 10,
    padding: 12,
    gap: 4,
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
