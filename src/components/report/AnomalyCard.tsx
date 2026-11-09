import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, TrendingDown, Activity, Droplets, Moon, Heart } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import type { ClinicalAnomaly } from '@/types';

interface AnomalyCardProps {
  anomalies: ClinicalAnomaly[];
}

const getIcon = (type: ClinicalAnomaly['type']) => {
  switch (type) {
    case 'anovulatory_gap':
      return <AlertTriangle size={16} color={Theme.colors.strainAmber} />;
    case 'pain_cluster':
      return <Activity size={16} color={Theme.colors.strainHigh} />;
    case 'hrv_drop':
      return <TrendingDown size={16} color={Theme.colors.secondary} />;
    case 'flow_heavy':
      return <Droplets size={16} color={Theme.colors.strainHigh} />;
    case 'sleep_deficit':
      return <Moon size={16} color={Theme.colors.secondary} />;
    case 'mood_pattern':
      return <Heart size={16} color={Theme.colors.secondary} />;
    default:
      return <AlertTriangle size={16} color={Theme.colors.strainAmber} />;
  }
};

const TYPE_LABELS: Partial<Record<ClinicalAnomaly['type'], string>> = {
  anovulatory_gap: 'cycle pattern',
  pain_cluster: 'pain',
  flow_heavy: 'bleeding',
  mood_pattern: 'mood',
  sleep_deficit: 'sleep',
};

const getSeverityColor = (severity: ClinicalAnomaly['severity']) => {
  switch (severity) {
    case 'critical':
      return { bg: '#FFF1F2', border: '#FECDD3', text: Theme.colors.strainHigh };
    case 'severe':
      return { bg: '#FFF7ED', border: '#FDBA74', text: '#D97706' };
    case 'moderate':
      return { bg: Theme.colors.secondaryLight, border: Theme.colors.secondaryBorder, text: Theme.colors.secondary };
    default:
      return { bg: Theme.colors.primaryLight, border: Theme.colors.cardBorder, text: Theme.colors.primary };
  }
};

export const AnomalyCard: React.FC<AnomalyCardProps> = ({ anomalies }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Patterns to Discuss</Text>
      <Text style={styles.sectionSubtitle}>From your last 30 days of logs — observations, not a diagnosis</Text>
      {anomalies.length === 0 ? (
        <View style={[styles.card, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
          <Text style={[styles.title, { color: '#047857' }]}>Nothing flagged yet</Text>
          <Text style={[styles.description, { marginBottom: 0 }]}>
            Keep logging pain, flow, mood and sleep. Patterns worth raising with a doctor will show up here.
          </Text>
        </View>
      ) : null}
      {anomalies.map((anomaly) => {
        const colors = getSeverityColor(anomaly.severity);
        return (
          <View
            key={anomaly.id}
            style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.border }]}
          >
            <View style={styles.headerRow}>
              {getIcon(anomaly.type)}
              <Text style={[styles.title, { color: colors.text }]}>
                {anomaly.icon} {anomaly.title}
              </Text>
            </View>
            <Text style={styles.description}>{anomaly.description}</Text>
            <View style={styles.severityRow}>
              <View style={[styles.severityBadge, { backgroundColor: colors.text }]}>
                <Text style={styles.severityText}>
                  {anomaly.severity === 'critical' ? 'SEE A DOCTOR' : anomaly.severity === 'severe' ? 'WORTH ASKING' : 'KEEP AN EYE'}
                </Text>
              </View>
              <Text style={[styles.typeText, { color: colors.text }]}>
                {TYPE_LABELS[anomaly.type] ?? anomaly.type.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  card: {
    borderRadius: Theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.textSecondary,
    marginBottom: 10,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.radius.full,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
