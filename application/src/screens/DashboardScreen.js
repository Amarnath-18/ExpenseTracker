import React, { useState, useContext, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getTransactions } from '../api/transactions';
import { logoutUser } from '../api/auth';
import { AuthContext } from '../../App';
import tokens from '../theme/tokens';
import BackgroundGlow from '../components/BackgroundGlow';
import GlassHeader from '../components/GlassHeader';
import GlassCard from '../components/GlassCard';
import MetricCard from '../components/MetricCard';
import CategoryBadge from '../components/CategoryBadge';
import EmptyState from '../components/EmptyState';

export default function DashboardScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { signOut } = useContext(AuthContext);

  const fetchTransactions = async (showFullLoading = true) => {
    try {
      if (showFullLoading) setLoading(true);
      const data = await getTransactions();
      setTransactions(data?.items || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      if (showFullLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(transactions.length === 0);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions(false);
  };

  const confirmLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
            } catch (e) {
              console.log('Backend logout failed, signing out locally', e);
            } finally {
              signOut();
            }
          },
        },
      ]
    );
  };

  // Calculate metrics
  const { totalSpend, transactionCount } = useMemo(() => {
    const total = transactions.reduce((acc, t) => {
      const val = parseFloat(t.amount);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    return {
      totalSpend: total,
      transactionCount: transactions.length,
    };
  }, [transactions]);

  const renderTransaction = ({ item }) => {
    const formattedAmount = Number(parseFloat(item.amount) || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formattedDate = item.date
      ? new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Recent';

    return (
      <GlassCard
        variant="default"
        style={styles.card}
        onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
        accessibilityLabel={`Transaction at ${item.merchant || item.description || 'Merchant'}, amount ${formattedAmount}`}
      >
        <View style={styles.cardRow}>
          {/* Category Icon Badge */}
          <CategoryBadge
            category={item.category || 'Other'}
            size="md"
            iconOnly
            style={styles.categoryIcon}
          />

          {/* Transaction Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.merchantTitle} numberOfLines={1}>
              {item.merchant || item.description || 'Expense'}
            </Text>

            <View style={styles.metaRow}>
              <Text style={styles.dateText}>{formattedDate}</Text>
              {item.payment_method ? (
                <>
                  <Text style={styles.dotSeparator}>•</Text>
                  <View style={styles.paymentMethodPill}>
                    <Text style={styles.paymentMethodText}>{item.payment_method}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>

          {/* Amount Badge */}
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>-₹{formattedAmount}</Text>
            <Ionicons name="chevron-forward" size={14} color={tokens.colors.textDim} />
          </View>
        </View>
      </GlassCard>
    );
  };

  const headerRightActions = (
    <>
      <TouchableOpacity
        onPress={() => fetchTransactions(true)}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Refresh transactions"
      >
        <Ionicons name="reload" size={18} color={tokens.colors.primaryLight} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={confirmLogout}
        style={styles.logoutButton}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Ionicons name="log-out-outline" size={18} color={tokens.colors.dangerLight} />
      </TouchableOpacity>
    </>
  );

  return (
    <BackgroundGlow>
      <GlassHeader
        title="Dashboard"
        subtitle="Manage your personal spending"
        badge="SPENDPULSE"
        rightActions={headerRightActions}
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeaderWrapper}>
              <MetricCard
                totalAmount={totalSpend}
                transactionCount={transactionCount}
                currency="₹"
                onAddPress={() => navigation.navigate('Add Expense')}
                onScanPress={() => navigation.navigate('Scan Receipt')}
              />

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <Text style={styles.sectionCountBadge}>
                  {transactions.length} total
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No Expenses Logged"
              description="Start tracking your expenses by manually adding one or scanning a receipt."
              actionTitle="Add First Expense"
              onActionPress={() => navigation.navigate('Add Expense')}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.colors.primaryLight}
              colors={[tokens.colors.primary]}
            />
          }
        />
      )}
    </BackgroundGlow>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 110, // space for floating bottom tab bar
  },
  listHeaderWrapper: {
    marginBottom: tokens.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xs,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: tokens.colors.text,
    letterSpacing: -0.2,
  },
  sectionCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textMuted,
    backgroundColor: tokens.colors.glassLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.round,
  },
  card: {
    marginHorizontal: tokens.spacing.md,
    marginVertical: 5,
    padding: tokens.spacing.sm + 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: tokens.spacing.md,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  merchantTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.text,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: tokens.colors.textMuted,
  },
  dotSeparator: {
    color: tokens.colors.textDim,
    marginHorizontal: 6,
    fontSize: 10,
  },
  paymentMethodPill: {
    backgroundColor: tokens.colors.glassLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: tokens.borderRadius.xs,
  },
  paymentMethodText: {
    fontSize: 10,
    color: tokens.colors.textMuted,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: tokens.spacing.sm,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.dangerLight,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.glassLight,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.dangerGlass,
    borderWidth: 1,
    borderColor: tokens.colors.dangerBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    color: tokens.colors.textMuted,
    fontSize: 14,
    marginTop: tokens.spacing.md,
    fontWeight: '500',
  },
});
