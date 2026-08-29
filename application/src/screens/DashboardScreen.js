import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import apiClient from '../api/client';
import { theme } from '../theme/colors';
import { AuthContext } from '../../App';

export default function DashboardScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { signOut } = useContext(AuthContext);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/transactions/');
      // The backend returns { items: [...], total: X }
      setTransactions(response.data?.items || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleLogout = async () => {
    try {
      // Optional: Call the backend to revoke the token, though client-side logout works fine for now
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.log('Backend logout failed, but signing out locally anyway', e);
    } finally {
      signOut();
    }
  };

  const renderTransaction = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.merchant || item.description || 'Unknown Expense'}</Text>
        <Text style={styles.amount}>${parseFloat(item.amount).toFixed(2)}</Text>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.category || 'General'}</Text>
        </View>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={fetchTransactions} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No transactions found.</Text>
            </View>
          }
        />
      )}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconButton: {
    padding: theme.spacing.sm,
  },
  iconButtonText: {
    fontSize: 22,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutButtonText: {
    color: theme.colors.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.danger,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  date: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 16,
  }
});
