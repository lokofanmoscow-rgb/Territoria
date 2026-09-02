import { Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/RootNavigator';
import Screen from '../components/Screen';

type Props = NativeStackScreenProps<RootStackParamList, 'GameResult'>;

// TODO: winner banner, per-player stats from rooms/{roomId} rounds archive.
export default function GameResultScreen({ navigation }: Props) {
  return (
    <Screen title="Игра окончена">
      <Button title="В лобби" onPress={() => navigation.popToTop()} />
    </Screen>
  );
}
