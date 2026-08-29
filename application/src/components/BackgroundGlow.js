import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tokens from '../theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * BackgroundGlow
 * Atmospheric ambient gradient orbs creating deep optical glass depth.
 */
export default function BackgroundGlow({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      {/* Base Canvas */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {/* Top-Right Indigo Glow Orb */}
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.22)', 'rgba(59, 130, 246, 0.08)', 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topRightOrb}
        />

        {/* Center-Left Violet/Cyan Ambient Orb */}
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.18)', 'rgba(6, 182, 212, 0.05)', 'transparent']}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0.8, y: 0.9 }}
          style={styles.centerLeftOrb}
        />

        {/* Bottom Emerald Subtle Glow */}
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.10)', 'transparent']}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0.2 }}
          style={styles.bottomOrb}
        />
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.canvas,
  },
  topRightOrb: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.1,
    right: -SCREEN_WIDTH * 0.25,
    width: SCREEN_WIDTH * 1.1,
    height: SCREEN_HEIGHT * 0.45,
    borderRadius: (SCREEN_WIDTH * 1.1) / 2,
  },
  centerLeftOrb: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.35,
    left: -SCREEN_WIDTH * 0.3,
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: (SCREEN_WIDTH * 0.9) / 2,
  },
  bottomOrb: {
    position: 'absolute',
    bottom: -SCREEN_HEIGHT * 0.08,
    right: -SCREEN_WIDTH * 0.15,
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.3,
    borderRadius: (SCREEN_WIDTH * 0.85) / 2,
  },
});
