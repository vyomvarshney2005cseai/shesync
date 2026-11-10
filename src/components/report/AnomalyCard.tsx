import React from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle, TrendingDown, Activity, Droplets, Moon, Heart } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
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

const getSeverityColor = (severity: ClinicalAnomaly['severity']) => {
  switch (severity) {
    case 'critical':
      return { bg: themed('#FFF1F2'), border: themed('#FECDD3'), text: Theme.colors.strainHigh };
    case 'severe':
      return { bg: themed('#FFF7ED'), border: themed('#FDBA74'), text: themed('#D97706') };
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
      <Text style={styles.sectionSubtitle}>From the last 30 days — observations, not a diagnosis</Text>
      {anomalies.length === 0 ? (
        <View style={[styles.card, { backgroundColor: themed('#ECFDF5'), borderColor: themed('#A7F3D0') }]}>
          <Text style={[styles.title, { color: themed('#047857') }]}>Nothing flagged yet</Text>
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
            style={[styles.card, { backgroundColor: themed(colors.bg), borderColor: themed(colors.border) }]}
          >
            <View style={styles.headerRow}>
              {getIcon(anomaly.type)}
              <Text style={[styles.title, { color: themed(colors.text) }]}>
                {anomaly.title}
              </Text>
            </View>
            <Text style={styles.description}>{anomaly.description}</Text>
            <View style={styles.severityRow}>
              <View style={[styles.severityBadge, { backgroundColor: themed(colors.text) }]}>
                <Text style={styles.severityText}>
                  {anomaly.severity === 'critical' ? 'SEE A DOCTOR' : anomaly.severity === 'severe' ? 'WORTH ASKING' : 'KEEP AN EYE'}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = createStyles(() => ({
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
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
}));
