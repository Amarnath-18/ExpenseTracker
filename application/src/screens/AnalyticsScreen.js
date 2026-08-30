import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getTransactions } from '../api/transactions';
import tokens from '../theme/tokens';
import BackgroundGlow from '../components/BackgroundGlow';
import GlassHeader from '../components/GlassHeader';
import GlassCard from '../components/GlassCard';
import CategoryBadge, { CATEGORY_CONFIG } from '../components/CategoryBadge';
import EmptyState from '../components/EmptyState';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'charts', label: 'Charts & Stats', icon: 'stats-chart-outline' },
  { id: 'daily', label: 'Day-Wise', icon: 'calendar-outline' },
  { id: 'monthly', label: 'Month-Wise', icon: 'time-outline' },
];

export default function AnalyticsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('charts');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async (showFullLoading = true) => {
    try {
      if (showFullLoading) setLoading(true);
      const data = await getTransactions();
      const items = (data.items || []).sort(
        (a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)
      );
      setTransactions(items);
    } catch (err) {
      console.error('Failed to fetch transactions in Analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(false);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions(false);
  };

  // --- Analytics Computations ---
  const {
    totalSpend,
    totalCount,
    categoryBreakdown,
    paymentBreakdown,
    dayGroups,
    monthGroups,
    recentDaysChart,
    topCategory,
    avgDailySpend,
  } = useMemo(() => {
    let total = 0;
    const catMap = {};
    const paymentMap = {};
    const daysMap = {};
    const monthsMap = {};

    transactions.forEach((tx) => {
      const amt = parseFloat(tx.amount) || 0;
      total += amt;

      // Category breakdown
      const cat = tx.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + amt;

      // Payment method breakdown
      const pay = tx.payment_method || 'Other';
      paymentMap[pay] = (paymentMap[pay] || 0) + amt;

      // Day grouping
      const dateStr = tx.date ? tx.date.split('T')[0] : 'Unknown Date';
      if (!daysMap[dateStr]) {
        daysMap[dateStr] = { date: dateStr, total: 0, items: [] };
      }
      daysMap[dateStr].total += amt;
      daysMap[dateStr].items.push(tx);

      // Month grouping (YYYY-MM)
      const monthKey = tx.date ? tx.date.substring(0, 7) : 'Unknown';
      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = { monthKey, total: 0, count: 0, items: [] };
      }
      monthsMap[monthKey].total += amt;
      monthsMap[monthKey].count += 1;
      monthsMap[monthKey].items.push(tx);
    });

    // Sorted Category List with Percentages
    const catList = Object.entries(catMap)
      .map(([name, sum]) => ({
        name,
        amount: sum,
        percentage: total > 0 ? (sum / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Sorted Payment Methods
    const payList = Object.entries(paymentMap)
      .map(([name, sum]) => ({
        name,
        amount: sum,
        percentage: total > 0 ? (sum / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Sorted Days
    const sortedDays = Object.values(daysMap).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // Sorted Months
    const sortedMonths = Object.values(monthsMap).sort(
      (a, b) => (b.monthKey > a.monthKey ? 1 : -1)
    );

    // Last 7 Active Days Bar Chart Data
    const chartDays = sortedDays.slice(0, 7).reverse().map((d) => {
      const dt = new Date(d.date);
      const dayLabel = isNaN(dt.getTime())
        ? d.date
        : dt.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        label: dayLabel,
        date: d.date,
        amount: d.total,
      };
    });

    const uniqueDaysCount = Math.max(sortedDays.length, 1);
    const avgDaily = total / uniqueDaysCount;
    const topCat = catList[0] ? catList[0].name : 'N/A';

    return {
      totalSpend: total,
      totalCount: transactions.length,
      categoryBreakdown: catList,
      paymentBreakdown: payList,
      dayGroups: sortedDays,
      monthGroups: sortedMonths,
      recentDaysChart: chartDays,
      topCategory: topCat,
      avgDailySpend: avgDaily,
    };
  }, [transactions]);

  // Helpers
  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    });

  const getDayHeading = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yesterday = yest.toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMonthHeading = (monthKey) => {
    if (!monthKey || monthKey === 'Unknown') return 'Unknown';
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month, 10) - 1, 1);
    if (isNaN(date.getTime())) return monthKey;
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const maxChartSpend = Math.max(...recentDaysChart.map((c) => c.amount), 1);

  return (
    <BackgroundGlow>
      <GlassHeader
        title="Analytics"
        subtitle="Spending insights & breakdowns"
        badge="REPORTS"
      />

      {/* Segmented Tab Switcher */}
      <View style={styles.tabBarContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? '#FFF' : tokens.colors.textMuted}
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primaryLight} />
        </View>
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No Data for Analytics"
          description="Log some transactions to see visual graphs, day-wise, and month-wise spending breakdowns."
          icon="stats-chart-outline"
          actionTitle="Add Your First Expense"
          onAction={() => navigation.navigate('Add Expense')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.colors.primaryLight}
            />
          }
        >
          {/* ========================================================= */}
          {/* VIEW 1: CHARTS & STATS OVERVIEW                           */}
          {/* ========================================================= */}
          {activeTab === 'charts' && (
            <View style={styles.responsiveWrapper}>
              {/* Top Stats Overview Grid */}
              <View style={styles.statsGrid}>
                <GlassCard variant="highlight" style={styles.statCard} contentStyle={styles.statCardContent}>
                  <View style={styles.statIconWrap}>
                    <Ionicons name="wallet-outline" size={18} color={tokens.colors.primaryLight} />
                  </View>
                  <Text style={styles.statLabel}>TOTAL SPENT</Text>
                  <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                    ₹{formatCurrency(totalSpend)}
                  </Text>
                </GlassCard>

                <GlassCard variant="default" style={styles.statCard} contentStyle={styles.statCardContent}>
                  <View style={[styles.statIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                    <Ionicons name="trending-up" size={18} color={tokens.colors.accentLight} />
                  </View>
                  <Text style={styles.statLabel}>DAILY AVERAGE</Text>
                  <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                    ₹{formatCurrency(avgDailySpend)}
                  </Text>
                </GlassCard>
              </View>

              <View style={styles.statsGrid}>
                <GlassCard variant="default" style={styles.statCard} contentStyle={styles.statCardContent}>
                  <View style={[styles.statIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Ionicons name="pricetag-outline" size={18} color={tokens.colors.successLight} />
                  </View>
                  <Text style={styles.statLabel}>TOP CATEGORY</Text>
                  <Text style={styles.statValueSub} numberOfLines={1}>
                    {topCategory}
                  </Text>
                </GlassCard>

                <GlassCard variant="default" style={styles.statCard} contentStyle={styles.statCardContent}>
                  <View style={[styles.statIconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                    <Ionicons name="receipt-outline" size={18} color={tokens.colors.cyan} />
                  </View>
                  <Text style={styles.statLabel}>TOTAL ENTRIES</Text>
                  <Text style={styles.statValue} numberOfLines={1}>
                    {totalCount}
                  </Text>
                </GlassCard>
              </View>

              {/* Graphical Bar Chart: Recent Days */}
              {recentDaysChart.length > 0 && (
                <GlassCard variant="default" style={styles.sectionCard} contentStyle={styles.sectionCardContent}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="bar-chart" size={18} color={tokens.colors.primaryLight} />
                    <Text style={styles.sectionTitle}>Daily Spending Trend</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Recent activity across days</Text>

                  <View style={styles.chartContainer}>
                    {recentDaysChart.map((bar, idx) => {
                      const heightPercent = Math.max((bar.amount / maxChartSpend) * 100, 8);
                      const isHighest = bar.amount === maxChartSpend && maxChartSpend > 0;

                      return (
                        <View key={`${bar.date}-${idx}`} style={styles.barCol}>
                          <Text style={styles.barAmountText} numberOfLines={1}>
                            ₹{bar.amount > 999 ? `${(bar.amount / 1000).toFixed(1)}k` : Math.round(bar.amount)}
                          </Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                { height: `${heightPercent}%` },
                                isHighest && styles.barFillHighlight,
                              ]}
                            />
                          </View>
                          <Text style={[styles.barLabelText, isHighest && styles.barLabelHighlight]}>
                            {bar.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </GlassCard>
              )}

              {/* Category Spending Breakdown Visualizer */}
              <GlassCard variant="default" style={styles.sectionCard} contentStyle={styles.sectionCardContent}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="pie-chart-outline" size={18} color={tokens.colors.accentLight} />
                  <Text style={styles.sectionTitle}>Category Breakdown</Text>
                </View>
                <Text style={styles.sectionSubtitle}>Where your money goes</Text>

                <View style={styles.categoryList}>
                  {categoryBreakdown.map((cat) => {
                    const catConfig = CATEGORY_CONFIG[cat.name] || CATEGORY_CONFIG.Other;
                    return (
                      <View key={cat.name} style={styles.categoryItem}>
                        <View style={styles.catInfoRow}>
                          <View style={styles.catLeft}>
                            <CategoryBadge category={cat.name} size="sm" />
                          </View>
                          <View style={styles.catRight}>
                            <Text style={styles.catAmountText}>₹{formatCurrency(cat.amount)}</Text>
                            <Text style={styles.catPercentText}>{cat.percentage.toFixed(1)}%</Text>
                          </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBarTrack}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${Math.max(cat.percentage, 4)}%`,
                                backgroundColor: catConfig.color || tokens.colors.primary,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </GlassCard>

              {/* Payment Methods Distribution */}
              <GlassCard variant="default" style={styles.sectionCard} contentStyle={styles.sectionCardContent}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="card-outline" size={18} color={tokens.colors.cyan} />
                  <Text style={styles.sectionTitle}>Payment Method Distribution</Text>
                </View>

                <View style={styles.paymentGrid}>
                  {paymentBreakdown.map((pay) => (
                    <View key={pay.name} style={styles.paymentPillCard}>
                      <Text style={styles.paymentNameText}>{pay.name}</Text>
                      <Text style={styles.paymentAmtText}>₹{formatCurrency(pay.amount)}</Text>
                      <Text style={styles.paymentPctText}>{pay.percentage.toFixed(0)}% of spend</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </View>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: DAY-WISE BREAKDOWN                                */}
          {/* ========================================================= */}
          {activeTab === 'daily' && (
            <View style={styles.responsiveWrapper}>
              {dayGroups.map((group) => (
                <View key={group.date} style={styles.dayGroupContainer}>
                  {/* Day Group Header Banner */}
                  <View style={styles.dayHeaderRow}>
                    <View style={styles.dayHeaderLeft}>
                      <Ionicons name="calendar" size={16} color={tokens.colors.primaryLight} />
                      <Text style={styles.dayHeaderText}>{getDayHeading(group.date)}</Text>
                      <Text style={styles.dayDateSubtext}>({group.date})</Text>
                    </View>
                    <View style={styles.dayHeaderRight}>
                      <Text style={styles.dayTotalBadge}>-₹{formatCurrency(group.total)}</Text>
                    </View>
                  </View>

                  {/* Day Transactions List */}
                  <GlassCard variant="default" style={styles.groupCard} contentStyle={{ padding: 0 }}>
                    {group.items.map((item, idx) => (
                      <TouchableOpacity
                        key={item.id || idx}
                        style={[
                          styles.groupTransactionRow,
                          idx === group.items.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
                        activeOpacity={0.7}
                      >
                        <CategoryBadge category={item.category || 'Other'} size="md" iconOnly />
                        <View style={styles.groupTxInfo}>
                          <Text style={styles.groupMerchantText} numberOfLines={1}>
                            {item.merchant || item.description || 'Expense'}
                          </Text>
                          <View style={styles.groupMetaRow}>
                            <Text style={styles.groupPayText}>{item.payment_method || 'UPI'}</Text>
                            {item.description ? (
                              <>
                                <Text style={styles.dotSeparator}>•</Text>
                                <Text style={styles.groupDescText} numberOfLines={1}>
                                  {item.description}
                                </Text>
                              </>
                            ) : null}
                          </View>
                        </View>
                        <Text style={styles.groupAmountText}>-₹{formatCurrency(item.amount)}</Text>
                        <Ionicons name="chevron-forward" size={14} color={tokens.colors.textDim} />
                      </TouchableOpacity>
                    ))}
                  </GlassCard>
                </View>
              ))}
            </View>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: MONTH-WISE BREAKDOWN                              */}
          {/* ========================================================= */}
          {activeTab === 'monthly' && (
            <View style={styles.responsiveWrapper}>
              {monthGroups.map((mGroup) => (
                <View key={mGroup.monthKey} style={styles.monthGroupContainer}>
                  {/* Month Hero Card */}
                  <GlassCard variant="hero" style={styles.monthHeroCard} contentStyle={styles.monthHeroContent}>
                    <View style={styles.monthTopRow}>
                      <View>
                        <Text style={styles.monthTitleText}>{getMonthHeading(mGroup.monthKey)}</Text>
                        <Text style={styles.monthSubtext}>
                          {mGroup.count} {mGroup.count === 1 ? 'transaction' : 'transactions'} logged
                        </Text>
                      </View>
                      <View style={styles.monthTotalWrap}>
                        <Text style={styles.monthTotalLabel}>TOTAL SPENT</Text>
                        <Text style={styles.monthTotalValue}>₹{formatCurrency(mGroup.total)}</Text>
                      </View>
                    </View>
                  </GlassCard>

                  {/* Month Item List */}
                  <GlassCard variant="default" style={styles.groupCard} contentStyle={{ padding: 0 }}>
                    {mGroup.items.map((item, idx) => (
                      <TouchableOpacity
                        key={item.id || idx}
                        style={[
                          styles.groupTransactionRow,
                          idx === mGroup.items.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
                        activeOpacity={0.7}
                      >
                        <CategoryBadge category={item.category || 'Other'} size="md" iconOnly />
                        <View style={styles.groupTxInfo}>
                          <Text style={styles.groupMerchantText} numberOfLines={1}>
                            {item.merchant || item.description || 'Expense'}
                          </Text>
                          <View style={styles.groupMetaRow}>
                            <Text style={styles.groupDateText}>{item.date || 'Recent'}</Text>
                            <Text style={styles.dotSeparator}>•</Text>
                            <Text style={styles.groupPayText}>{item.payment_method || 'UPI'}</Text>
                          </View>
                        </View>
                        <Text style={styles.groupAmountText}>-₹{formatCurrency(item.amount)}</Text>
                        <Ionicons name="chevron-forward" size={14} color={tokens.colors.textDim} />
                      </TouchableOpacity>
                    ))}
                  </GlassCard>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </BackgroundGlow>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: tokens.spacing.md,
    paddingBottom: 120,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  // Tab Bar Switcher
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.glassBase,
    marginHorizontal: tokens.spacing.md,
    marginVertical: tokens.spacing.sm,
    padding: 4,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: tokens.borderRadius.md,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: tokens.colors.primaryDark,
    borderColor: tokens.colors.primaryLight,
  },
  tabIcon: {
    marginRight: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textMuted,
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  statCard: {
    flex: 1,
  },
  statCardContent: {
    padding: tokens.spacing.md,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: tokens.colors.text,
  },
  statValueSub: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  // Section Cards
  sectionCard: {
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  sectionCardContent: {
    padding: tokens.spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: tokens.colors.textMuted,
    marginBottom: tokens.spacing.md,
  },
  // Chart Elements
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 16,
    paddingBottom: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barAmountText: {
    fontSize: 9,
    fontWeight: '600',
    color: tokens.colors.textDim,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 90,
    backgroundColor: tokens.colors.glassLight,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: tokens.colors.primary,
    borderRadius: 7,
  },
  barFillHighlight: {
    backgroundColor: tokens.colors.accentLight,
  },
  barLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.textMuted,
    marginTop: 6,
  },
  barLabelHighlight: {
    color: '#FFF',
    fontWeight: '700',
  },
  // Category List
  categoryList: {
    gap: tokens.spacing.md,
  },
  categoryItem: {
    gap: 6,
  },
  catInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catRight: {
    alignItems: 'flex-end',
  },
  catAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  catPercentText: {
    fontSize: 11,
    color: tokens.colors.textMuted,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: tokens.colors.glassLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Payment Grid
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  paymentPillCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: tokens.colors.glassLight,
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
  },
  paymentNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.text,
    marginBottom: 4,
  },
  paymentAmtText: {
    fontSize: 15,
    fontWeight: '800',
    color: tokens.colors.primaryLight,
  },
  paymentPctText: {
    fontSize: 11,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  // Day Grouping
  dayGroupContainer: {
    marginBottom: tokens.spacing.md,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: tokens.spacing.xs + 2,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  dayDateSubtext: {
    fontSize: 12,
    color: tokens.colors.textDim,
  },
  dayTotalBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.dangerLight,
  },
  groupCard: {
    borderRadius: tokens.borderRadius.md,
  },
  groupTransactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.glassBorderSubtle,
  },
  groupTxInfo: {
    flex: 1,
    marginLeft: tokens.spacing.sm,
  },
  groupMerchantText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.text,
    marginBottom: 2,
  },
  groupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupPayText: {
    fontSize: 11,
    color: tokens.colors.textMuted,
  },
  groupDateText: {
    fontSize: 11,
    color: tokens.colors.textMuted,
  },
  groupDescText: {
    fontSize: 11,
    color: tokens.colors.textDim,
    flex: 1,
  },
  dotSeparator: {
    marginHorizontal: 4,
    color: tokens.colors.textDim,
    fontSize: 10,
  },
  groupAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.text,
    marginRight: 6,
  },
  // Month Grouping
  monthGroupContainer: {
    marginBottom: tokens.spacing.lg,
  },
  monthHeroCard: {
    marginBottom: tokens.spacing.xs,
  },
  monthHeroContent: {
    padding: tokens.spacing.lg,
  },
  monthTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: tokens.colors.text,
  },
  monthSubtext: {
    fontSize: 12,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  monthTotalWrap: {
    alignItems: 'flex-end',
  },
  monthTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.primaryLight,
    letterSpacing: 0.8,
  },
  monthTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: tokens.colors.text,
  },
});
