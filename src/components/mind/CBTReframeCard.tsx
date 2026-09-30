import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Brain, Send, Check } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import type { CBTPrompt } from '@/types';

interface CBTReframeCardProps {
  prompt: CBTPrompt;
  onSubmit: (response: string) => void;
}

export const CBTReframeCard: React.FC<CBTReframeCardProps> = ({
  prompt,
  onSubmit,
}) => {
  const [text, setText] = useState(prompt.userResponse ?? '');
  const isSubmitted = !!prompt.userResponse;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Brain size={20} color={Theme.colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.typeLabel}>CBT REFRAMING</Text>
          <Text style={styles.trigger}>Triggered by: {prompt.trigger}</Text>
        </View>
      </View>

      {/* Prompt Text */}
      <Text style={styles.promptText}>{prompt.prompt}</Text>

      {/* Input Area */}
      {isSubmitted ? (
        <View style={styles.submittedWrap}>
          <View style={styles.checkBadge}>
            <Check size={14} color={Theme.colors.strainOptimal} />
          </View>
          <View style={styles.submittedContent}>
            <Text style={styles.submittedLabel}>Your reflection</Text>
            <Text style={styles.submittedText}>{prompt.userResponse}</Text>
          </View>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder={prompt.placeholder}
            placeholderTextColor={Theme.colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <PrimaryButton
            title="Save Reflection"
            variant="dark"
            icon={<Send size={14} color="#FFFFFF" />}
            onPress={() => text.trim() && onSubmit(text.trim())}
            fullWidth
            style={{ marginTop: 12 }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  trigger: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  promptText: {
    fontSize: 14,
    lineHeight: 21,
    color: Theme.colors.textPrimary,
    fontWeight: '500',
    marginBottom: 14,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: Theme.radius.md,
    padding: 14,
    fontSize: 14,
    color: Theme.colors.textPrimary,
    minHeight: 80,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    lineHeight: 20,
  },
  submittedWrap: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    padding: 14,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittedContent: {
    flex: 1,
  },
  submittedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.strainOptimal,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  submittedText: {
    fontSize: 13,
    lineHeight: 19,
    color: Theme.colors.textPrimary,
  },
});
