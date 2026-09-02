import { StyleSheet, Text, View } from 'react-native';

interface ReinforcementPanelProps {
  available: number;
  allocated: Record<number, number>;
}

// TODO: +/- controls per selected province, clamp to `available`.
export default function ReinforcementPanel({ available, allocated }: ReinforcementPanelProps) {
  const used = Object.values(allocated).reduce((sum, n) => sum + n, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Подкрепления: {used} / {available}
      </Text>
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
