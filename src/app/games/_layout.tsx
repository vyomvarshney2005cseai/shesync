import { Stack } from 'expo-router';
import { AuthGate } from '@/components/common/AuthGate';
import { Theme } from '@/constants/theme';

export default function GamesLayout() {
  return (
    <AuthGate>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: Theme.colors.background },
        }}
      />
    </AuthGate>
  );
}
