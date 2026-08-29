import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { createTransaction } from '../api/transactions';
import tokens from '../theme/tokens';
import BackgroundGlow from '../components/BackgroundGlow';
import GlassHeader from '../components/GlassHeader';
import GlassCard from '../components/GlassCard';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import { CATEGORY_CONFIG } from '../components/CategoryBadge';

const CATEGORIES = [
  'Food',
  'Groceries',
  'Shopping',
  'Transport',
  'Bills',
  'Entertainment',
  'Health',
  'Other',
];

const PAYMENT_METHODS = [
  { name: 'UPI', icon: 'qr-code-outline' },
  { name: 'Credit Card', icon: 'card-outline' },
  { name: 'Debit Card', icon: 'card' },
  { name: 'Cash', icon: 'cash-outline' },
  { name: 'Net Banking', icon: 'business-outline' },
];

const AMOUNT_PRESETS = [100, 250, 500, 1000, 2000];

export default function AddTransactionScreen({ navigation }) {
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const getYesterdayString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Food');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState(getTodayString());
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setAmount('');
    setMerchant('');
    setCategory('Food');
    setPaymentMethod('UPI');
    setDate(getTodayString());
    setDescription('');
    setError('');
  };

  const handleAddPreset = (presetVal) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + presetVal).toString());
    if (error) setError('');
  };

  const handleSave = async () => {
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!date.trim()) {
      setError('Please enter a valid date (YYYY-MM-DD).');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        amount: parsedAmount,
        currency: 'INR',
        merchant: merchant.trim() || null,
        category: category.trim() || null,
        payment_method: paymentMethod.trim() || null,
        date: date.trim(),
        description: description.trim() || null,
      };

      await createTransaction(payload);

      Alert.alert('Success', 'Transaction logged successfully!', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            navigation.navigate('Dashboard');
          },
        },
      ]);
    } catch (err) {
      console.error('Failed to create transaction:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          setError(detail);
        } else if (Array.isArray(detail)) {
          setError(detail.map((d) => d.msg).join(', '));
        } else {
          setError('Failed to save transaction. Please check inputs.');
        }
      } else {
        setError('Network error or failed to save transaction.');
      }
    } finally {
      setLoading(false);
    }
  };

  const canGoBack = navigation.canGoBack();

  return (
    <BackgroundGlow>
      <GlassHeader
        title="Add Expense"
        subtitle="Log a new transaction"
        badge="MANUAL ENTRY"
        showBack={canGoBack}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.responsiveWrapper}>
            {/* Error Feedback */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={tokens.colors.dangerLight} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Hero Amount Field */}
            <GlassCard variant="highlight" style={styles.amountCard}>
              <Text style={styles.amountLabel}>AMOUNT (INR)</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.amountCurrency}>₹</Text>
                <TextInput
                  value={amount}
                  onChangeText={(val) => {
                    setAmount(val);
                    if (error) setError('');
                  }}
                  placeholder="0.00"
                  placeholderTextColor={tokens.colors.textDim}
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                  autoFocus={false}
                />
              </View>

              {/* Quick Preset Buttons */}
              <View style={styles.presetRow}>
                {AMOUNT_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => handleAddPreset(preset)}
                    style={styles.presetButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.presetButtonText}>+₹{preset}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>

            {/* Transaction Details Glass Form */}
            <GlassCard variant="default" style={styles.formCard}>
              {/* Merchant / Payee */}
              <GlassInput
                label="Merchant / Payee"
                placeholder="e.g. Starbucks, Amazon, Uber, Supermarket"
                value={merchant}
                onChangeText={setMerchant}
                icon="business-outline"
              />

              {/* Category Selector */}
              <View style={styles.sectionContainer}>
                <Text style={styles.fieldLabel}>Category *</Text>
                <View style={styles.chipsWrap}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    const catConfig = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Other;

                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          isSelected && {
                            backgroundColor: catConfig.bgColor,
                            borderColor: catConfig.color,
                          },
                        ]}
                        onPress={() => setCategory(cat)}
                        activeOpacity={0.75}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Ionicons
                          name={catConfig.icon}
                          size={15}
                          color={isSelected ? catConfig.color : tokens.colors.textMuted}
                          style={styles.chipIcon}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && { color: tokens.colors.text, fontWeight: '700' },
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Payment Method Selector */}
              <View style={styles.sectionContainer}>
                <Text style={styles.fieldLabel}>Payment Method *</Text>
                <View style={styles.chipsWrap}>
                  {PAYMENT_METHODS.map((pm) => {
                    const isSelected = paymentMethod === pm.name;

                    return (
                      <TouchableOpacity
                        key={pm.name}
                        style={[
                          styles.paymentChip,
                          isSelected && styles.paymentChipSelected,
                        ]}
                        onPress={() => setPaymentMethod(pm.name)}
                        activeOpacity={0.75}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Ionicons
                          name={pm.icon}
                          size={14}
                          color={isSelected ? tokens.colors.primaryLight : tokens.colors.textMuted}
                          style={styles.chipIcon}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.paymentTextSelected,
                          ]}
                        >
                          {pm.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Date Input with Shortcuts */}
              <View style={styles.sectionContainer}>
                <View style={styles.dateLabelRow}>
                  <Text style={styles.fieldLabel}>Date (YYYY-MM-DD) *</Text>
                  <View style={styles.dateShortcuts}>
                    <TouchableOpacity
                      onPress={() => setDate(getTodayString())}
                      style={[
                        styles.dateShortcutPill,
                        date === getTodayString() && styles.dateShortcutPillActive,
                      ]}
                    >
                      <Text style={styles.dateShortcutText}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDate(getYesterdayString())}
                      style={[
                        styles.dateShortcutPill,
                        date === getYesterdayString() && styles.dateShortcutPillActive,
                      ]}
                    >
                      <Text style={styles.dateShortcutText}>Yesterday</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <GlassInput
                  placeholder="YYYY-MM-DD"
                  value={date}
                  onChangeText={setDate}
                  icon="calendar-outline"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>

              {/* Notes / Description */}
              <GlassInput
                label="Notes / Description (Optional)"
                placeholder="Add optional context or tags..."
                value={description}
                onChangeText={setDescription}
                icon="document-text-outline"
                multiline
                numberOfLines={3}
              />

              {/* Submit Button */}
              <GlassButton
                title="Save Transaction"
                onPress={handleSave}
                loading={loading}
                variant="primary"
                size="lg"
                icon="save-outline"
                style={styles.saveButton}
              />
            </GlassCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundGlow>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.md,
    paddingBottom: 110, // clear floating tab bar
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.dangerGlass,
    borderWidth: 1,
    borderColor: tokens.colors.dangerBorder,
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    marginBottom: tokens.spacing.md,
    gap: 8,
  },
  errorText: {
    color: tokens.colors.dangerLight,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  amountCard: {
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.primaryLight,
    letterSpacing: 1,
    marginBottom: tokens.spacing.xs,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountCurrency: {
    fontSize: 36,
    fontWeight: '800',
    color: tokens.colors.primaryLight,
    marginRight: 6,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '800',
    color: tokens.colors.text,
    minWidth: 140,
    textAlign: 'left',
    padding: 0,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: tokens.spacing.md,
  },
  presetButton: {
    backgroundColor: tokens.colors.glassLight,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: tokens.borderRadius.round,
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  formCard: {
    padding: tokens.spacing.lg,
  },
  sectionContainer: {
    marginBottom: tokens.spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.xs + 2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.glassInput,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.textMuted,
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.glassInput,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
  },
  paymentChipSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.20)',
    borderColor: tokens.colors.primaryLight,
  },
  paymentTextSelected: {
    color: tokens.colors.text,
    fontWeight: '700',
  },
  dateLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateShortcuts: {
    flexDirection: 'row',
    gap: 6,
  },
  dateShortcutPill: {
    backgroundColor: tokens.colors.glassLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.round,
  },
  dateShortcutPillActive: {
    backgroundColor: tokens.colors.primaryLight,
  },
  dateShortcutText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  saveButton: {
    marginTop: tokens.spacing.md,
  },
});
