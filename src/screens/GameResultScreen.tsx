import { Button, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/RootNavigator';
import Screen from '../components/Screen';

type Props = NativeStackScreenProps<RootStackParamList, 'GameResult'>;

// TODO: детальная статистика партии из rooms/{roomId}/rounds — пока только победитель.
export default function GameResultScreen({ route, navigation }: Props) {
  const { winnerName } = route.params;

  return (
    <Screen title="Игра окончена">
      <Text style={{ color: '#fff', fontSize: 18 }}>
        {winnerName ? `Победитель: ${winnerName}` : 'Партия завершена'}
      </Text>
      <Button title="В лобби" onPress={() => navigation.popToTop()} />
    </Screen>
  );
}
