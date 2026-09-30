import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Header } from '@/components/common/Header';
import { CalibratedScorecard } from '@/components/report/CalibratedScorecard';
import { TrendChart } from '@/components/report/TrendChart';
import { AnomalyCard } from '@/components/report/AnomalyCard';
import { ClinicalExportCTA } from '@/components/report/ClinicalExportCTA';
import { useAppStore } from '@/store/useAppStore';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';

export default function ReportScreen() {
  const clinicalReport = useAppStore((s) => s.clinicalReport);
  const generateClinicalPDF = useAppStore((s) => s.generateClinicalPDF);

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
              title="Doctor Co-Pilot"
              subtitle="90-Day Clinical Irregularity Intelligence"
              badge="Clinical Export"
            />
            <View style={styles.mainContent}>
              <CalibratedScorecard />
              <TrendChart data={clinicalReport.trendData} />
              <AnomalyCard anomalies={clinicalReport.anomalies} />
              <ClinicalExportCTA
                isGenerating={clinicalReport.isGenerating}
                generatedAt={clinicalReport.generatedAt}
                onGenerate={generateClinicalPDF}
              />
            </View>
          </View>
        </ScrollView>
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
  mainContent: {
    paddingHorizontal: 16,
  },
});
