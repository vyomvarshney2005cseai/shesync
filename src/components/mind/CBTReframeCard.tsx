import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Brain, Send, Check } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { Button } from '@/components/ds';
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
          <Text style={styles.typeLabel}>Reframe a thought</Text>
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
          <Button
            title="Save Reflection"
            variant="primary"
            icon={<Send size={18} color={Theme.colors.onPrimary} />}
            onPress={() => text.trim() && onSubmit(text.trim())}
            fullWidth
            style={{ marginTop: 12 }}
          />
        </>
      )}
    </View>
  );
};

const styles = createStyles(() => ({
  container: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  trigger: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  promptText: {
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.textPrimary,
    fontWeight: '500',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: Theme.radius.md,
    padding: 16,
    fontSize: 16,
    color: Theme.colors.textPrimary,
    minHeight: 80,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    lineHeight: 20,
  },
  submittedWrap: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    padding: 16,
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
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.strainOptimal,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  submittedText: {
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.textPrimary,
  },
}));
