import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '@react-native-vector-icons/ionicons';
import { API_LAUNDRY_ORDER_LIST_URL } from '../api';
import { useNavigation, useRoute } from '@react-navigation/native';
const OrdersHistoryScreen = () => {
    const navigation = useNavigation(); 
    const route = useRoute();
  const [userId, setUserId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId);
        if (storedUserId) {
          fetchOrders(storedUserId);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
        setError('Failed to load user information');
        setLoading(false);
      }
    };
    fetchUserId();
  }, []);
  const fetchOrders = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_LAUNDRY_ORDER_LIST_URL}?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log("Data in Order History Screen-----------------", data);
      if (response.status === 404) {
        console.log("No orders found for user:", userId);
        setOrders([]);
      } else if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      } else if (data && data.orders) {
        console.log("Orders in Order History--------------------", data.orders);
        setOrders(data.orders);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load order history');
      setLoading(false);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(userId);
    setRefreshing(false);
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed':
        return '#FF9800';
      case 'In Progress':
        return '#2196F3';
      case 'Out for Delivery':
        return '#9C27B0';
      case 'Delivered':
        return '#4CAF50';
      case 'Cancelled':
        return '#F44336';
      case 'Picked Up':
        return '#edc81f';
      default:
        return '#73788B';
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Order Placed':
        return <Icon name="time-outline" size={22} color={getStatusColor(status)} />;
      case 'In Progress':
        return <Icon name="refresh-outline" size={22} color={getStatusColor(status)} />;
      case 'Out for Delivery':
        return <Icon name="bicycle-outline" size={22} color={getStatusColor(status)} />;
      case 'Delivered':
        return <Icon name="checkmark-circle-outline" size={22} color={getStatusColor(status)} />;
      case 'Cancelled':
        return <Icon name="close-circle-outline" size={22} color={getStatusColor(status)} />;
      case 'Picked Up':
        return <Icon name="bag-check-outline" size={22} color={getStatusColor(status)} />;
      default:
        return <Icon name="help-circle-outline" size={22} color={getStatusColor(status)} />;
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  const filteredOrders = activeFilter === 'All' 
    ? orders 
    : orders.filter(order => order.OrderStatusName === activeFilter);
  const renderFilterOption = (filter) => (
    <TouchableOpacity 
      style={[
        styles.filterOption, 
        activeFilter === filter && styles.activeFilterOption
      ]}
      onPress={() => setActiveFilter(filter)}
    >
      <Text 
        style={[
          styles.filterText, 
          activeFilter === filter && styles.activeFilterText
        ]}
      >
        {filter}
      </Text>
    </TouchableOpacity>
  );
  const renderOrderItem = ({ item }) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order ID</Text>
          <Text style={styles.orderId}>#{item.OrderId}</Text>
        </View>
        <View style={styles.orderDateContainer}>
          <Text style={styles.orderDateLabel}>Placed on</Text>
          <Text style={styles.orderDate}>{formatDate(item.CreatedAt)}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.companyContainer}>
        <Icon name="business-outline" size={18} color="#46345B" />
        <Text style={styles.companyName}>{item.CompanyName}</Text>
      </View>
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <View style={styles.statusContainer}>
            {getStatusIcon(item.OrderStatusName)}
            <Text style={[styles.statusText, { color: getStatusColor(item.OrderStatusName) }]}>
              {item.OrderStatusName}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.orderFooter}>
      <TouchableOpacity 
  style={styles.detailsButton} 
  onPress={() => navigation.navigate('TrackOrder', { orderDetails: item })}
>
  <Text style={styles.detailsButtonText}>View Details</Text>
  <Icon name="chevron-forward-outline" size={16} color="#FFF" />
</TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#46345B" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => fetchOrders(userId)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (orders.length === 0) {
    return (
       <SafeAreaView style={styles.container}>
          <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyText}>
            You haven't placed any Ironing orders yet.
            When you do, they will appear here.
          </Text>
          {/* <TouchableOpacity style={styles.shopNowButton}>
            <Text style={styles.shopNowText}>Place an Order</Text>
          </TouchableOpacity> */}
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View> */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {renderFilterOption('All')}
          {renderFilterOption('Order Placed')}
          {renderFilterOption('In Progress')}
          {renderFilterOption('Out for Delivery')}
          {renderFilterOption('Delivered')}
          {renderFilterOption('Picked Up')}
          {renderFilterOption('Cancelled')}
        </ScrollView>
      </View>
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.ID.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing} 
        onRefresh={onRefresh}  
        ListEmptyComponent={
          <View style={styles.noResultsContainer}>
            <Icon name="search-outline" size={48} color="#ADB2D4" />
            <Text style={styles.noResultsText}>No {activeFilter} orders found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  headerContainer: {
    backgroundColor: '#F5761A',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F0F2F5',
  },
  activeFilterOption: {
    backgroundColor: '#F5761A',
  },
  filterText: {
    fontSize: 14,
    color: '#73788B',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    boxShadow: '5px 5px 10px #ccc',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderIdContainer: {
    justifyContent: 'center',
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#73788B',
    marginBottom: 2,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2598d3',
  },
  orderDateContainer: {
    alignItems: 'flex-end',
  },
  orderDateLabel: {
    fontSize: 12,
    color: '#73788B',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#46345B',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f5',
    marginVertical: 12,
  },
  companyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyName: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
    color: '#46345B',
  },
  orderDetails: {
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  orderFooter: {
    alignItems: 'flex-end',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5761A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#46345B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    padding: 24,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#46345B',
  },
  errorText: {
    marginTop: 8,
    fontSize: 16,
    color: '#73788B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#46345B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#73788B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  shopNowButton: {
    backgroundColor: '#46345B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    marginTop: 16,
    fontSize: 16,
    color: '#73788B',
    textAlign: 'center',
  },
});
export default OrdersHistoryScreen;