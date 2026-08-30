import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { deleteTransaction } from '../api/transactions';
import tokens from '../theme/tokens';
import BackgroundGlow from '../components/BackgroundGlow';
import GlassHeader from '../components/GlassHeader';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import CategoryBadge from '../components/CategoryBadge';
import { useModal } from '../contexts/ModalContext';

export default function TransactionDetailScreen({ route, navigation }) {
  const { transaction } = route.params || {};
  const [deleting, setDeleting] = useState(false);
  const { showModal } = useModal();

  if (!transaction) {
    return (
      <BackgroundGlow>
        <GlassHeader
          title="Details"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Transaction not found.</Text>
          <GlassButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={{ marginTop: tokens.spacing.md }}
          />
        </View>
      </BackgroundGlow>
    );
  }

  const formattedAmount = Number(parseFloat(transaction.amount) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedDate = transaction.date
    ? new Date(transaction.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  const formattedTime = transaction.created_at
    ? new Date(
        transaction.created_at.endsWith('Z')
          ? transaction.created_at
          : `${transaction.created_at}Z`
      ).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const handleDelete = () => {
    showModal({
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this expense? This action cannot be reversed.',
      type: 'confirm',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          setDeleting(true);
          await deleteTransaction(transaction.id);
          navigation.goBack();
        } catch (err) {
          console.error('Delete transaction failed:', err);
          showModal({
            title: 'Error',
            message: 'Failed to delete transaction. Please try again.',
            type: 'error',
          });
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  return (
    <BackgroundGlow>
      <GlassHeader
        title="Transaction Details"
        subtitle="Expense breakdown"
        badge="RECORD"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveWrapper}>
          {/* Amount Hero Glass Card */}
          <GlassCard variant="hero" style={styles.heroCard} contentStyle={styles.heroCardContent}>
            <CategoryBadge
              category={transaction.category || 'Other'}
              size="lg"
              iconOnly
              style={styles.heroCategoryBadge}
            />

            <Text style={styles.merchantName} numberOfLines={2}>
              {transaction.merchant || transaction.description || 'Unknown Expense'}
            </Text>

            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.amountValue} adjustsFontSizeToFit numberOfLines={1}>{formattedAmount}</Text>
            </View>

            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Completed Payment</Text>
            </View>
          </GlassCard>

          {/* Detailed Info Grid Card */}
          <GlassCard variant="default" style={styles.detailsCard} contentStyle={styles.detailsCardContent}>
            <Text style={styles.cardSectionHeading}>TRANSACTION METADATA</Text>

            {/* Category Row */}
            <View style={styles.detailRow}>
              <View style={styles.rowLabelContainer}>
                <Ionicons name="pricetag-outline" size={16} color={tokens.colors.primaryLight} />
                <Text style={styles.detailLabel}>Category</Text>
              </View>
              <CategoryBadge category={transaction.category || 'Other'} size="md" />
            </View>
            <View style={styles.divider} />

            {/* Date Row */}
            <View style={styles.detailRow}>
              <View style={styles.rowLabelContainer}>
                <Ionicons name="calendar-outline" size={16} color={tokens.colors.primaryLight} />
                <Text style={styles.detailLabel}>Date</Text>
              </View>
              <Text style={styles.detailValue}>{formattedDate}</Text>
            </View>
            <View style={styles.divider} />

            {/* Payment Method Row */}
            <View style={styles.detailRow}>
              <View style={styles.rowLabelContainer}>
                <Ionicons name="card-outline" size={16} color={tokens.colors.primaryLight} />
                <Text style={styles.detailLabel}>Payment Method</Text>
              </View>
              <View style={styles.paymentMethodPill}>
                <Text style={styles.paymentMethodText}>
                  {transaction.payment_method || 'UPI / Other'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />

            {/* Time Logged */}
            {formattedTime && (
              <>
                <View style={styles.detailRow}>
                  <View style={styles.rowLabelContainer}>
                    <Ionicons name="time-outline" size={16} color={tokens.colors.primaryLight} />
                    <Text style={styles.detailLabel}>Time Logged</Text>
                  </View>
                  <Text style={styles.detailValue}>{formattedTime}</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}

            {/* Description / Notes */}
            <View style={styles.descriptionSection}>
              <View style={styles.rowLabelContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={tokens.colors.primaryLight}
                />
                <Text style={styles.detailLabel}>Notes & Context</Text>
              </View>
              <Text style={styles.descriptionText}>
                {transaction.description || 'No additional notes provided for this transaction.'}
              </Text>
            </View>
          </GlassCard>

          {/* Action Buttons (Edit & Delete) */}
          <View style={styles.actionsContainer}>
            <GlassButton
              title="Edit Expense"
              onPress={() => navigation.navigate('AddTransaction', { transaction })}
              variant="primary"
              size="md"
              icon="create-outline"
              style={styles.editButton}
            />

            <GlassButton
              title="Delete Expense"
              onPress={handleDelete}
              loading={deleting}
              variant="danger"
              size="md"
              icon="trash-outline"
              style={styles.deleteButton}
            />
          </View>
        </View>
      </ScrollView>
    </BackgroundGlow>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: tokens.spacing.md,
    paddingBottom: 40,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  heroCard: {
    marginBottom: tokens.spacing.md,
  },
  heroCardContent: {
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  heroCategoryBadge: {
    marginBottom: tokens.spacing.md,
  },
  merchantName: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: tokens.spacing.xs,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: tokens.colors.dangerLight,
    marginRight: 4,
  },
  amountValue: {
    fontSize: 44,
    fontWeight: '800',
    color: tokens.colors.text,
    letterSpacing: -1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.successGlass,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: tokens.borderRadius.round,
    borderWidth: 1,
    borderColor: tokens.colors.successBorder,
    marginTop: tokens.spacing.sm,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.success,
  },
  statusText: {
    color: tokens.colors.successLight,
    fontSize: 12,
    fontWeight: '600',
  },
  detailsCard: {
    marginBottom: tokens.spacing.lg,
  },
  detailsCardContent: {
    padding: tokens.spacing.lg,
  },
  cardSectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.textMuted,
    letterSpacing: 1,
    marginBottom: tokens.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
  },
  rowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: tokens.colors.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: tokens.colors.text,
    fontWeight: '600',
  },
  paymentMethodPill: {
    backgroundColor: tokens.colors.glassLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.borderRadius.xs,
  },
  paymentMethodText: {
    fontSize: 13,
    color: tokens.colors.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.glassBorder,
    marginVertical: 4,
  },
  descriptionSection: {
    paddingTop: tokens.spacing.sm,
  },
  descriptionText: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    lineHeight: 20,
    marginTop: tokens.spacing.xs + 2,
  },
  actionsContainer: {
    gap: 10,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.lg,
  },
  editButton: {
    width: '100%',
  },
  deleteButton: {
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: tokens.colors.textMuted,
  },
});
