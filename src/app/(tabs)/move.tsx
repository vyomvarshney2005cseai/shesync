import React from 'react';
import { ScrollView, View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { Header } from '@/components/common/Header';
import { InterventionBanner } from '@/components/move/InterventionBanner';
import { AdaptiveWorkoutCard } from '@/components/move/AdaptiveWorkoutCard';
import { AdaptationHistory } from '@/components/move/AdaptationHistory';
import { useAppStore } from '@/store/useAppStore';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';

export default function MoveScreen() {
  const todayWorkout = useAppStore((s) => s.todayWorkout);
  const workoutHistory = useAppStore((s) => s.workoutHistory);
  const showBiologicalReasoning = useAppStore((s) => s.showBiologicalReasoning);
  const toggleBiologicalReasoning = useAppStore((s) => s.toggleBiologicalReasoning);

  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollWrapper}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centeredWrapper}>
            <Header
              title="Adaptive Movement"
              subtitle="Hormone & Cortisol-Responsive Workouts"
              badge="Movement Engine"
            />
            <InterventionBanner />
            <AdaptiveWorkoutCard
              workout={todayWorkout}
              onViewReasoning={toggleBiologicalReasoning}
            />
            <AdaptationHistory history={workoutHistory} />
          </View>
        </ScrollView>

      {/* Biological Reasoning Modal */}
      <Modal
        visible={showBiologicalReasoning}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={toggleBiologicalReasoning}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Biological Reasoning</Text>
            <Pressable onPress={toggleBiologicalReasoning} style={styles.closeBtn}>
              <X size={20} color={Theme.colors.textPrimary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.reasonSection}>
              <Text style={styles.reasonLabel}>WHY YOUR WORKOUT WAS OVERRIDDEN</Text>
              <Text style={styles.reasonText}>{todayWorkout.reason}</Text>
            </View>
            <View style={styles.reasonDivider} />
            <View style={styles.reasonSection}>
              <Text style={styles.reasonLabel}>ORIGINAL PLAN</Text>
              <Text style={styles.reasonOriginal}>{todayWorkout.overriddenFrom}</Text>
            </View>
            <View style={styles.reasonDivider} />
            <View style={styles.reasonSection}>
              <Text style={styles.reasonLabel}>ADAPTED PLAN</Text>
              <Text style={styles.reasonAdapted}>{todayWorkout.title}</Text>
              <Text style={styles.reasonDesc}>{todayWorkout.description}</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  </AdaptiveBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingTop: 4,
  },
  centeredWrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  modalSafe: {
    flex: 1,
    backgroundColor: '#FFEBF2',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  reasonSection: {
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 15,
    lineHeight: 23,
    color: Theme.colors.textPrimary,
    fontWeight: '500',
  },
  reasonOriginal: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.strainHigh,
    textDecorationLine: 'line-through',
  },
  reasonAdapted: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.strainOptimal,
    marginBottom: 6,
  },
  reasonDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: Theme.colors.textSecondary,
  },
  reasonDivider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
    marginVertical: 16,
  },
});
