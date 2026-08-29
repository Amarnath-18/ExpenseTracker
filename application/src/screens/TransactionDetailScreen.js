import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme/colors';

export default function TransactionDetailScreen({ route, navigation }) {
  const { transaction } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.amountBanner}>
          <Text style={styles.merchantText}>{transaction.merchant || transaction.description || 'Unknown Expense'}</Text>
          <Text style={styles.amountText}>${parseFloat(transaction.amount).toFixed(2)}</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{transaction.category || 'General'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{new Date(transaction.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{transaction.payment_method || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />

          {transaction.created_at && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time Logged</Text>
                <Text style={styles.detailValue}>
                  {new Date(
                    transaction.created_at.endsWith('Z') 
                      ? transaction.created_at 
                      : `${transaction.created_at}Z`
                  ).toLocaleTimeString()}
                </Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValueMultiline}>
              {transaction.description || 'No description provided.'}
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: 60, // for notch
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  amountBanner: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  merchantText: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  amountText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.danger,
  },
  detailsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  detailColumn: {
    paddingVertical: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  detailValueMultiline: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
    marginTop: theme.spacing.xs,
  },
  badge: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 14,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
});
