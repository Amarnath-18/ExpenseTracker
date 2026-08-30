import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import tokens from '../theme/tokens';

/**
 * MetricCard
 * Hero glass card on Dashboard summarizing total spending, counts, and quick actions.
 */
export default function MetricCard({
  totalAmount = 0,
  transactionCount = 0,
  currency = '₹',
  onAddPress,
  onScanPress,
}) {
  const formattedTotal = Number(totalAmount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >

        {/* Header summary label */}
        <View style={styles.headerRow}>
          <View style={styles.badge}>
            <View style={styles.pulseDot} />
            <Text style={styles.badgeText}>EXPENSE OVERVIEW</Text>
          </View>
          <View style={styles.countBadge}>
            <Ionicons name="receipt-outline" size={12} color={tokens.colors.primaryLight} />
            <Text style={styles.countText}>
              {transactionCount} {transactionCount === 1 ? 'Record' : 'Records'}
            </Text>
          </View>
        </View>

        {/* Hero Amount */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>{currency}</Text>
          <Text style={styles.amountValue} adjustsFontSizeToFit numberOfLines={1}>{formattedTotal}</Text>
        </View>

        <Text style={styles.subtext}>Total logged expenses</Text>

        {/* Action Shortcuts */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButtonPrimary}
            onPress={onAddPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add new transaction"
          >
            <LinearGradient
              colors={tokens.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons name="add-circle" size={18} color="#FFF" />
            <Text style={styles.actionButtonText}>Add Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={onScanPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Scan receipt photo"
          >
            <Ionicons name="scan-outline" size={18} color={tokens.colors.primaryLight} />
            <Text style={styles.actionSecondaryText}>Scan Receipt</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.md,
    marginVertical: tokens.spacing.xs + 2,
    borderRadius: tokens.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
    ...(Platform.OS === 'ios' ? tokens.shadows.card : { elevation: 2 }),
  },
  gradientCard: {
    padding: tokens.spacing.md,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.borderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.primaryLight,
    marginRight: 6,
  },
  badgeText: {
    color: tokens.colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.glassLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.borderRadius.round,
    gap: 4,
  },
  countText: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: tokens.colors.primaryLight,
    marginRight: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: tokens.colors.text,
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 12,
    color: tokens.colors.textMuted,
    marginBottom: tokens.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  actionButtonPrimary: {
    flex: 1,
    height: 38,
    borderRadius: tokens.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  actionButtonSecondary: {
    flex: 1,
    height: 38,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.glassLight,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionSecondaryText: {
    color: tokens.colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
});
