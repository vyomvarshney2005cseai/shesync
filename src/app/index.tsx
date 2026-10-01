import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { Heart, ArrowRight, UserCheck, Quote as QuoteIcon } from 'lucide-react-native';

const SLIDES = [
  {
    tag: 'Feminism',
    headline: 'I am a woman!\nAnd what’s your\nsuper power?',
    quote: 'Feminism isn’t about making women stronger. Women are already strong. It’s about changing the way the world perceives that strength.',
    author: 'G.D. Anderson',
    image: require('@/../assets/images/slide1.png'),
  },
  {
    tag: 'Empowerment',
    headline: 'Limitless Power\nWithin You.',
    quote: 'There is no limit to what we, as women, can accomplish together.',
    author: 'Michelle Obama',
    image: require('@/../assets/images/slide2.png'),
  },
  {
    tag: 'Sisterhood & Voice',
    headline: 'Stand for Yourself,\nStand for All Women.',
    quote: 'Each time a woman stands up for herself, without knowing it possibly, without claiming it, she stands up for all women.',
    author: 'Maya Angelou',
    image: require('@/../assets/images/slide3.png'),
  },
  {
    tag: 'Sovereign Health',
    headline: 'Deliberate and\nAfraid of Nothing.',
    quote: 'Caring for myself is not self-indulgence, it is self-preservation, and that is an act of political warfare.',
    author: 'Audre Lorde',
    image: require('@/../assets/images/slide4.png'),
  },
];

export default function WelcomeScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const transitionToSlide = (newIndex: number) => {
    // Fade out and slight shift
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setActiveSlide(newIndex);
      slideAnim.setValue(12);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  // Auto-sliding quotes timer: automatically advances every 3.8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      transitionToSlide((activeSlide + 1) % SLIDES.length);
    }, 3800);

    return () => clearInterval(timer);
  }, [activeSlide]);

  const handleManualSlide = (index: number) => {
    if (index === activeSlide) return;
    transitionToSlide(index);
  };

  const handleHeartPress = () => {
    transitionToSlide((activeSlide + 1) % SLIDES.length);
  };

  const currentContent = SLIDES[activeSlide] || SLIDES[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.outerCenterWrapper}>
        <ScrollView
          style={styles.scrollWrapper}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Brand Bar Header */}
          <View style={styles.brandBar}>
            <View style={styles.brandLogoRow}>
              <Image
                source={require('@/../assets/images/shesync-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.brandTitle}>SheSync</Text>
                <Text style={styles.brandSubtitle}>Bio-Adaptive Feminine Health</Text>
              </View>
            </View>
          </View>

          {/* Hero Card Container */}
          <View style={styles.heroCard}>
            {/* Pagination Indicators */}
            <View style={styles.paginationRow}>
              <View style={styles.indicatorsGroup}>
                {SLIDES.map((_, index) => {
                  const isActive = index === activeSlide;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleManualSlide(index)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                    >
                      <View
                        style={[
                          styles.indicatorBase,
                          isActive ? styles.indicatorActive : styles.indicatorInactive,
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Animated Auto-Sliding Quote Section */}
            <Animated.View
              style={[
                styles.slidingQuoteArea,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              {/* Main Hero Illustration */}
              <View style={styles.illustrationContainer}>
                <Image
                  source={currentContent.image}
                  style={styles.heroImage}
                  resizeMode="contain"
                />
              </View>

              {/* Headline */}
              <Text style={styles.headlineText}>
                {currentContent.headline}
              </Text>

              {/* Quote & Author */}
              <View style={styles.quoteBox}>
                <QuoteIcon size={14} color={Theme.colors.feminismAccent} style={styles.quoteIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quoteBody}>
                    &ldquo;{currentContent.quote}&rdquo;
                  </Text>
                  <Text style={styles.quoteAuthor}>
                    — {currentContent.author}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Action CTAs in place of "Read Now! It's Free" */}
            <View style={styles.actionSection}>
              {/* Primary: Sign Up Button */}
              <TouchableOpacity
                style={styles.signUpButton}
                activeOpacity={0.88}
                onPress={() => router.push('/signup')}
              >
                <Text style={styles.signUpText}>Sign Up</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Secondary: Log In Button */}
              <TouchableOpacity
                style={styles.logInButton}
                activeOpacity={0.8}
                onPress={() => router.push('/login')}
              >
                <UserCheck size={16} color={Theme.colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.logInText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFEBF2',
  },
  outerCenterWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'stretch',
  },
  scrollWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 4,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.2,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: '#FFD7E3',
  },
  versionText: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.feminismAccent,
    letterSpacing: 0.8,
  },
  heroCard: {
    backgroundColor: '#FFEBF2',
    borderRadius: 32,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  illustrationContainer: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  indicatorsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicatorBase: {
    height: 6,
    borderRadius: 3,
  },
  indicatorActive: {
    width: 28,
    backgroundColor: '#000000',
  },
  indicatorInactive: {
    width: 7,
    borderWidth: 1.5,
    borderColor: '#111827',
    backgroundColor: 'transparent',
  },
  heartButton: {
    padding: 4,
  },
  slidingQuoteArea: {
    minHeight: 160,
    paddingHorizontal: 4,
    justifyContent: 'flex-start',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.feminismAccent,
    letterSpacing: 0.8,
  },
  autoSlideHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  headlineText: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: Theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD7E3',
  },
  quoteIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  quoteBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#374151',
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.feminismAccent,
    marginTop: 4,
  },
  actionSection: {
    gap: 10,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  signUpButton: {
    backgroundColor: '#000000',
    borderRadius: Theme.radius.md,
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Theme.shadows.card,
  },
  signUpText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    flexShrink: 1,
    textAlign: 'center',
  },
  logInButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: Theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FFD3E0',
    ...Theme.shadows.soft,
  },
  logInText: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
});
