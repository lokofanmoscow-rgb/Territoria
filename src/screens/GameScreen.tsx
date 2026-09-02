import { Button, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/RootNavigator';
import MapSvg from '../components/MapSvg';
import { getMapData } from '../assets/maps';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

// TODO: reinforcements + attacks panel, submit pendingMoves, listen for round resolution.
export default function GameScreen({ route, navigation }: Props) {
  const { roomId } = route.params;
  const mapData = getMapData('small_01');

  return (
    <View style={styles.container}>
      <MapSvg map={mapData} />
      <Button title="Завершить ход" onPress={() => navigation.navigate('GameResult', { roomId })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101820',
  },
});
