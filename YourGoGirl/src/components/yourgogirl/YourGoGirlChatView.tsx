import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Sparkles,
  Send,
  Heart,
  Brain,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Flame,
  Compass,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import {
  COUNSELLOR_MODES,
  QUICK_PROMPT_TOPICS,
  generateYourGoGirlResponse,
} from '@/lib/yourGoGirlEngine';
import type { CounsellorMode, YourGoGirlMessage } from '@/types';

interface YourGoGirlChatViewProps {
  showBackButton?: boolean;
}

export const YourGoGirlChatView: React.FC<YourGoGirlChatViewProps> = ({
  showBackButton = false,
}) => {
  const userName = useAppStore((s) => s.userName);
  const cycle = useAppStore((s) => s.cycle);
  const biometrics = useAppStore((s) => s.biometrics);
  const symptomLogs = useAppStore((s) => s.symptomLogs);
  const fineTuningSettings = useAppStore((s) => s.fineTuningSettings);
  const messages = useAppStore((s) => s.yourGoGirlMessages);
  const mode = useAppStore((s) => s.yourGoGirlMode);
  const addMessage = useAppStore((s) => s.addYourGoGirlMessage);
  const setMode = useAppStore((s) => s.setYourGoGirlMode);
  const clearChat = useAppStore((s) => s.clearYourGoGirlChat);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, [messages.length, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const trimmed = (textToSend ?? inputText).trim();
    if (!trimmed || isTyping) return;

    if (!textToSend) {
      setInputText('');
    }

    const userMsg: YourGoGirlMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    addMessage(userMsg);
    setIsTyping(true);

    try {
      const botReply = await generateYourGoGirlResponse(trimmed, {
        userName,
        cycle,
        biometrics,
        symptomLogs,
        fineTuningSettings,
        mode,
      });
      addMessage(botReply);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper to render bold segments wrapped in **...**
  const renderFormattedText = (raw: string, isUser: boolean) => {
    const parts = raw.split(/(\*\*.*?\*\*)/g);
    return (
      <Text style={[styles.messageText, isUser && styles.userMessageText]}>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <Text
                key={idx}
                style={[styles.boldText, isUser && styles.userBoldText]}
              >
                {part.slice(2, -2)}
              </Text>
            );
          }
          return <Text key={idx}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Top Counsellor Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            {showBackButton && (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color={Theme.colors.textPrimary} />
              </TouchableOpacity>
            )}
            <View style={styles.avatarRing}>
              <View style={styles.avatarCore}>
                <Sparkles size={20} color="#FFFFFF" />
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.titleCol}>
              <View style={styles.nameRow}>
                <Text style={styles.botName}>YourGoGirl</Text>
                <View style={styles.aiPill}>
                  <Text style={styles.aiPillText}>AI COUNSELLOR</Text>
                </View>
              </View>
              <Text style={styles.botSubtitle} numberOfLines={1}>
                Menstruation • Cycle Disturbances • Focus & Motivation
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={clearChat}
            style={styles.resetBtn}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Live Bio-Sync Strip */}
        <View style={styles.bioSyncBar}>
          <ShieldCheck size={13} color={Theme.colors.primary} />
          <Text style={styles.bioSyncText} numberOfLines={1}>
            Synced with {userName}: Day {cycle.currentDay} ({cycle.phase}) • Strain{' '}
            {biometrics.strainScore}% • {cycle.conditions.join(' / ')}
          </Text>
        </View>

        {/* Counsellor Mode Selector Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeScroll}
        >
          {COUNSELLOR_MODES.map((m) => {
            const active = m.id === mode;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => setMode(m.id as CounsellorMode)}
                style={[styles.modeChip, active && styles.modeChipActive]}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.modeChipText, active && styles.modeChipTextActive]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Chat Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Topic Starter Cards */}
        <View style={styles.topicsWrapper}>
          <Text style={styles.topicsHeaderLabel}>
            ASK YOURGOGIRL ABOUT WHAT YOU&apos;RE FACING TODAY:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicsScroll}
          >
            {QUICK_PROMPT_TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.topicCard}
                onPress={() => handleSendMessage(topic.prompt)}
                activeOpacity={0.8}
              >
                <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                <Text style={styles.topicLabel}>{topic.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Conversation Messages */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isUser ? styles.userRow : styles.botRow,
              ]}
            >
              {!isUser && (
                <View style={styles.msgAvatar}>
                  <Heart size={14} color="#FFFFFF" />
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.botBubble,
                ]}
              >
                {renderFormattedText(msg.text, isUser)}

                {/* Biological Why Card (for Bot responses) */}
                {!isUser && msg.biologicalWhy && (
                  <View style={styles.bioCard}>
                    <View style={styles.bioCardHeader}>
                      <Brain size={14} color={Theme.colors.secondary} />
                      <Text style={styles.bioCardTitle}>
                        WHY YOUR BODY & HORMONES FEEL THIS WAY
                      </Text>
                    </View>
                    <Text style={styles.bioCardBody}>{msg.biologicalWhy}</Text>
                  </View>
                )}

                {/* Gentle Actionable Counselling Steps */}
                {!isUser &&
                  msg.gentleActionSteps &&
                  msg.gentleActionSteps.length > 0 && (
                    <View style={styles.stepsCard}>
                      <View style={styles.stepsHeader}>
                        <Compass size={14} color={Theme.colors.primaryDark} />
                        <Text style={styles.stepsTitle}>
                          GENTLE COUNSELLOR STEPS FOR RIGHT NOW
                        </Text>
                      </View>
                      {msg.gentleActionSteps.map((step, i) => (
                        <View key={i} style={styles.stepRow}>
                          <CheckCircle2
                            size={14}
                            color={Theme.colors.strainOptimal}
                            style={{ marginTop: 2 }}
                          />
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                {/* Empowering Affirmation Banner */}
                {!isUser && msg.affirmation && (
                  <View style={styles.affirmationBox}>
                    <Flame size={13} color={Theme.colors.primary} />
                    <Text style={styles.affirmationText}>
                      &ldquo;{msg.affirmation}&rdquo;
                    </Text>
                  </View>
                )}

                {/* Follow-Up Counselling Suggestions */}
                {!isUser &&
                  msg.followUpSuggestions &&
                  msg.followUpSuggestions.length > 0 && (
                    <View style={styles.followUpContainer}>
                      <Text style={styles.followUpHeader}>
                        Continue talking with YourGoGirl:
                      </Text>
                      <View style={styles.followUpList}>
                        {msg.followUpSuggestions.map((sugg, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.followUpChip}
                            onPress={() => handleSendMessage(sugg)}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.followUpChipText}>{sugg}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                <Text
                  style={[
                    styles.timestampText,
                    isUser && styles.userTimestampText,
                  ]}
                >
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <View style={[styles.messageRow, styles.botRow]}>
            <View style={styles.msgAvatar}>
              <Heart size={14} color="#FFFFFF" />
            </View>
            <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color={Theme.colors.primary} />
              <Text style={styles.typingText}>
                YourGoGirl is tuning into your cycle & preparing counsel...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Input Composer */}
      <View style={styles.composerBar}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask YourGoGirl about periods, focus, motivation, or mood..."
          placeholderTextColor={Theme.colors.textTertiary}
          multiline
          maxLength={600}
          onSubmitEditing={() => handleSendMessage()}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
          ]}
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim() || isTyping}
          activeOpacity={0.8}
        >
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  headerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.cardBorder,
    ...Theme.shadows.soft,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    backgroundColor: '#FFE4E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCore: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Theme.colors.strainOptimal,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  titleCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botName: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  aiPill: {
    backgroundColor: Theme.colors.secondaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.secondaryBorder,
  },
  aiPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.secondaryDark,
    letterSpacing: 0.5,
  },
  botSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  resetBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Theme.colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  bioSyncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FFF5F8',
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: '#FFD8E4',
  },
  bioSyncText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
    flex: 1,
  },
  modeScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  modeChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  modeChipTextActive: {
    color: '#FFFFFF',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 14,
  },
  topicsWrapper: {
    marginBottom: 4,
  },
  topicsHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.7,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  topicsScroll: {
    gap: 8,
    paddingRight: 12,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  topicEmoji: {
    fontSize: 15,
  },
  topicLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: Theme.radius.xl,
    padding: 15,
  },
  userBubble: {
    backgroundColor: Theme.colors.primary,
    borderBottomRightRadius: 6,
    ...Theme.shadows.soft,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    color: Theme.colors.textPrimary,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  boldText: {
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  userBoldText: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bioCard: {
    marginTop: 12,
    backgroundColor: Theme.colors.secondaryLight,
    borderRadius: Theme.radius.md,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.secondary,
  },
  bioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bioCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.secondaryDark,
    letterSpacing: 0.5,
  },
  bioCardBody: {
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.textPrimary,
  },
  stepsCard: {
    marginTop: 10,
    backgroundColor: '#FFF5F8',
    borderRadius: Theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFE0EA',
    gap: 7,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  stepsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primaryDark,
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: Theme.colors.textPrimary,
  },
  affirmationBox: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  affirmationText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#92400E',
  },
  followUpContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FFF0F5',
  },
  followUpHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginBottom: 6,
  },
  followUpList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  followUpChip: {
    backgroundColor: Theme.colors.backgroundAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: '#FFD6E4',
  },
  followUpChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
  },
  timestampText: {
    fontSize: 10,
    color: Theme.colors.textTertiary,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTimestampText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  typingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.cardBorder,
  },
  textInput: {
    flex: 1,
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: Theme.colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.soft,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
