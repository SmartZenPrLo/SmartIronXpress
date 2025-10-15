import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Linking,
  Modal,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_LAUNDRY_ORDER_CANCEL_URL, API_PRICE_LIST_URL, API_ORDER_SUMMARY_VIEW_URL } from '../api';
import { API_BASE_URL } from '../config';
import Bike from '../../assets/AppIconiBR.png';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
const getCurrencySymbol = (currencyCode) => {
  const currencyMap = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'INR': '₹',
  'AED': 'د.إ',
  'AUD': 'A$',
  'CAD': '$',
  'CHF': 'CHF',
  'CNY': '¥',
  'HKD': 'HK$',
  'NZD': '$',
  'SEK': 'kr',
  'SGD': '$',
  'ZAR': 'R',
  'NGN': '₦',
  'AFN': '؋',
  'ALL': 'L',
  'AMD': 'Դ',
  'AZN': '₼',
  'BBD': '$',
  'BDT': '৳',
  'BHD': 'د.ب',
  'BIF': 'FBu',
  'BMD': '$',
  'BND': '$',
  'BOB': 'Bs.',
  'BRL': 'R$',
  'BSD': '$',
  'BTN': 'Nu.',
  'BWP': 'P',
  'BYN': 'Br',
  'BZD': 'BZ$',
  'CDF': 'FC',
  'CLP': '$',
  'COP': '$',
  'CRC': '₡',
  'CUP': '₱',
  'CVE': 'Esc',
  'CZK': 'Kč',
  'DJF': 'Fdj',
  'DKK': 'kr',
  'DOP': '$',
  'DZD': 'دج',
  'EGP': '£',
  'ERN': 'Nkf',
  'ESP': '₧',
  'ETB': 'Br',
  'FJD': 'FJ$',
  'FKP': '£',
  'GEL': 'ლ',
  'GHS': '¢',
  'GIP': '£',
  'GMD': 'D',
  'GNF': '₣',
  'GQE': 'XAF',
  'GRD': '₯',
  'GTQ': 'Q',
  'GYD': '$',
  'HNL': 'L',
  'HRK': 'kn',
  'HTG': 'G',
  'HUF': 'Ft',
  'IDR': 'Rp',
  'ILS': '₪',
  'IMP': '£',
  'IQD': 'ع',
  'IRR': '﷼',
  'ISK': 'kr',
  'JMD': 'J$',
  'KES': 'KSh',
  'KGS': 'лв',
  'KHR': '៛',
  'KMF': 'CF',
  'KRW': '₩',
  'KWD': 'د.ك',
  'KYD': '$',
  'KZT': '₸',
  'LAK': '₭',
  'LBP': 'ل.ل.',
  'LKR': 'Rs',
  'LRD': '$',
  'LSL': 'M',
  'LTL': 'Lt',
  'LVL': 'Ls',
  'LYD': 'ل.د',
  'MAD': 'MAD',
  'MDL': 'L',
  'MGA': 'Ar',
  'MKD': 'ден',
  'MMK': 'K',
  'MNT': '₮',
  'MOP': 'MOP$',
  'MRO': 'UM',
  'MUR': '₨',
  'MWK': 'MK',
  'MXN': '$',
  'MYR': 'RM',
  'MZN': 'MT',
  'NAD': '$',
  'NIO': 'C$',
  'NPR': 'Rs',
  'OMR': 'ر.ع.',
  'PAB': 'B/.',
  'PEN': 'S/',
  'PGK': 'K',
  'PHP': '₱',
  'PKR': 'Rs',
  'PLN': 'zł',
  'PYG': 'Gs',
  'QAR': 'QR',
  'RON': 'lei',
  'RSD': 'дин.',
  'RUB': '₽',
  'RWF': 'FRw',
  'SAR': 'ر.س',
  'SBD': 'Si$',
  'SCR': '₨',
  'SHP': '£',
  'SLL': 'Le',
  'SOS': 'Sh.so',
  'SRD': '$',
  'SSP': '£',
  'STD': 'Db',
  'SYP': '£S',
  'SZL': 'L',
  'THB': '฿',
  'TMT': 'm',
  'TND': 'د.ت',
  'TOP': 'T$',
  'TRY': '₺',
  'TTD': 'TT$',
  'TWD': 'NT$',
  'TZS': 'TSh',
  'UAH': '₴',
  'UGX': 'USh',
  'UYU': '$U',
  'VEF': 'Bs',
  'VND': '₫',
  'VUV': 'Vt',
  'WST': 'T',
  'XAF': 'XOF',
  'XCD': '$',
  'XOF': 'CFA',
  'XPF': 'CFP',
  'YER': '﷼',
  'ZMK': 'ZK',
  'ZMW': 'ZK',
  'ZWL': 'Z$'
};
  return currencyMap[currencyCode] || currencyCode;
};

const ErrorModal = ({ visible, message, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.errorIconContainer}>
            <Icon name="alert-circle-outline" size={50} color="#F44336" />
          </View>
          {/* <Text style={styles.errorTitle}>Oops!</Text> */}
          <Text style={styles.errorMessage}>{message}</Text>
          <TouchableOpacity 
            style={styles.modalCloseButton} 
            onPress={onClose}
          >
            <Text style={styles.modalCloseButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const TrackOrder = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderDetails } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(orderDetails?.OrderStatus || 1);
  const [statusName, setStatusName] = useState(orderDetails?.OrderStatusName || 'Order Placed');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderSummary, setOrderSummary] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [priceListData, setPriceListData] = useState([]);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [imagePath, setImagePath] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [BranchID, setBranchID] = useState(null);
 const [userId, setUserId] = useState(null);

  console.log("Order Details in Track Order:", orderDetails);
    console.log("currency-=-=-=-=-=-=-=-=-= Track Order:", currencyCode);
  const allStatuses = [
    { id: 1, label: 'Order Placed', icon: 'hourglass-outline', color: '#FF9800', description: 'Your order has been received' },
    { id: 6, label: 'Picked Up', icon: 'bag-check-outline', color: '#edc81f', description: 'Items have been picked up' },
    { id: 2, label: 'In Progress', icon: 'water-outline', color: '#2196F3', description: 'Your clothes are being pressed' },
    { id: 3, label: 'Out for Delivery', icon: 'bicycle-outline', color: '#9C27B0', description: 'Your order is out for delivery' },
    { id: 4, label: 'Delivered', icon: 'home-outline', color: '#4CAF50', description: 'Your order has been delivered' }
  ];
  
  const cancelledStatus = { id: 5, label: 'Cancelled', icon: 'close-circle-outline', color: '#F44336', description: 'This order has been cancelled' };
  const isCancelled = statusName === 'Cancelled';
  useEffect(() => {
    if (isCancelled) {
      setProgressPercentage(0);
      return;
    }
    const statusOrder = [
      { id: 1, percentage: 0 }, 
      { id: 6, percentage: 25 }, 
      { id: 2, percentage: 50 },  
      { id: 3, percentage: 75 },
      { id: 4, percentage: 100 },
    ];
    
    const currentStatusIndex = statusOrder.findIndex(status => status.id === currentStatus);
    if (currentStatusIndex !== -1) {
      setProgressPercentage(statusOrder[currentStatusIndex].percentage);
    } else {
      setProgressPercentage(0);
    }
  }, [currentStatus, isCancelled]);



useEffect(() => {
  const fetchUserIdAndBranch = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedBranchID = await AsyncStorage.getItem('BranchID');

      console.log('BranchID=-==-=-=-=-=-=-=-=-=-=-=-=', storedBranchID);
      console.log('USERID=-==-=-=-=-=-=-=-=-=-=-=-=', storedUserId);

      if (storedBranchID && storedBranchID !== 'null' && storedBranchID !== 'undefined') {
        setBranchID(storedBranchID);
      } else {
        console.warn("BranchID missing in storage, setting default value");
      }

      if (storedUserId) setUserId(storedUserId);
    } catch (error) {
      console.error("Error reading AsyncStorage:", error);
    }
  };

  fetchUserIdAndBranch();
}, []);


useEffect(() => {
  const fetchPriceList = async () => {
    try {
      if (!orderDetails?.CompanyId || !BranchID) {
        console.warn("Missing CompanyId or BranchID — skipping price list fetch");
        return;
      }

      const response = await fetch(
        `${API_PRICE_LIST_URL}?CompanyId=${orderDetails.CompanyId}&BranchID=${BranchID}`
      );
      const data = await response.json();

      console.log("Price List Data:--------------------", data);

      if (Array.isArray(data) && data.length > 0) {
        setPriceListData(data);

        if (data[0]?.Currency) {
          setCurrencyCode(data[0].Currency);
          console.log("Setting currency code to:", data[0].Currency);
        }

        setImagePath(`${API_BASE_URL}/uploads/dress/`);
      }
    } catch (error) {
      console.error("Error fetching price list:", error);
    }
  };

  fetchPriceList();
}, [orderDetails?.CompanyId, BranchID]); // ✅ proper dependencies

// ✅ Fetch order summary when order details change
useEffect(() => {
  const fetchOrderSummary = async () => {
    try {
      setSummaryLoading(true);
      const orderId = orderDetails?.OrderId;

      if (!orderId) {
        setErrorMessage("Order ID not found");
        setErrorModalVisible(true);
        setSummaryLoading(false);
        return;
      }

      const response = await fetch(`${API_ORDER_SUMMARY_VIEW_URL}?OrderId=${orderId}`);
      const data = await response.json();

      console.log("Order Summary Data:--------------------", data);

      if (response.ok && data.orders) {
        setOrderSummary(data.orders);
        const total = data.orders.reduce(
          (sum, item) => sum + parseFloat(item.TotalPrice || 0),
          0
        );
        setTotalAmount(total);
      } else {
        console.error("Failed to fetch order summary:", data.message);
      }
    } catch (error) {
      console.error("Error fetching order summary:", error);
    } finally {
      setSummaryLoading(false);
    }
  };

  if (orderDetails?.OrderId) {
    fetchOrderSummary();
  }
}, [orderDetails?.OrderId]);

  const isStatusCompleted = (statusId) => {
    const statusOrder = [1, 6, 2, 3, 4];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const checkIndex = statusOrder.indexOf(statusId);
    return checkIndex <= currentIndex;
  };
  
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
  const getEstimatedDelivery = () => {
    if (orderDetails?.DueDate) {
      return formatDate(orderDetails.DueDate);
    } else if (orderDetails?.OrderDateTime) {
      const dueDate = new Date(orderDetails.OrderDateTime);
      dueDate.setDate(dueDate.getDate() + 3);
      return formatDate(dueDate);
    }
    return 'Calculating...';
  };
  const handleCancelOrder = async () => {
    try {
      setIsLoading(true);
      const orderId = orderDetails?.OrderId;
      
      if (!orderId) {
        setErrorMessage("Order ID not found");
        setErrorModalVisible(true);
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`${API_LAUNDRY_ORDER_CANCEL_URL}/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ OrderStatus: 5 }),
      }); 
      const data = await response.json();
      console.log("Cancel Order Response:--------------------", data);
      if (response.ok) {
        setCurrentStatus(5);
        setStatusName('Cancelled');
        setErrorMessage("Order has been cancelled successfully");
        setErrorModalVisible(true);
      } else {
        setErrorMessage(data.message || "Failed to cancel order");
        setErrorModalVisible(true);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      setErrorMessage("Something went wrong while cancelling the order");
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const contactButtonPress = () => {
    const phoneNumber = orderDetails?.PhoneNumber;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      setErrorMessage("Phone number is not available");
      setErrorModalVisible(true);
    }
  };

  const formatCurrency = (amount) => {
    const symbol = getCurrencySymbol(currencyCode);
    console.log('currency symbol-=-=-=-=-=-=-=-=-=',symbol);
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  };
  
  const getDressTypeImage = (dressTypeId) => {
    if (!priceListData.length) return null;
    
    const foundItem = priceListData.find(item => item.DressTypeId === dressTypeId);
    return foundItem?.ImageFileName || null;
  };
  
  const groupedItems = orderSummary.reduce((acc, item) => {
    const key = `${item.DressTypeId}-${item.DressTypeName}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
  const getStatusColor = () => {
    const status = allStatuses.find(s => s.id === currentStatus);
    return status ? status.color : '#46345B';
  };

  return (
     <SafeAreaView style={styles.safeArea}>
          <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <ErrorModal 
        visible={errorModalVisible}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#F5761A" />
          </TouchableOpacity>
          <Text style={styles.title}>Track Order</Text>
        </View>
        
        <View style={styles.orderSummary}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderId}> Order <Text style={styles.order}>#{orderDetails?.OrderId || 'N/A'}</Text> </Text>
            {isCancelled && (
              <View style={styles.cancelledBadge}>
                <Text style={styles.cancelledText}>Cancelled</Text>
              </View>
            )}
          </View>
          <Text style={styles.orderDate}>Pickup scheduled for {formatDate(orderDetails?.OrderDateTime)}</Text>
          {!isCancelled && (
            <View style={styles.deliveryEstimate}>
              <Icon name="time-outline" size={20} color="#46345B" />
              <Text style={styles.deliveryText}>
                Estimated Delivery: {getEstimatedDelivery()}
              </Text>
            </View>
          )}
        </View>

        {isCancelled ? (
          <View style={styles.cancelledCard}>
            <View style={[styles.statusIconCircle, { backgroundColor: cancelledStatus.color }]}>
              <Icon name={cancelledStatus.icon} size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.cancelledTitle}>Order Cancelled</Text>
            <Text style={styles.cancelledDescription}>
              This order has been cancelled and will not be processed.
            </Text>
          </View>
        ) : (
          <View style={styles.trackingCard}>
            <Text style={styles.cardTitle}>Order Status</Text>
            <View style={styles.divider} />
            <View style={styles.progressContainer}>
  <View style={styles.progressBarBackground}>
    <View 
      style={[
        styles.progressBarFill, 
        { 
          width: `${progressPercentage}%`,
          backgroundColor: getStatusColor()
        }
      ]} 
    />
    {progressPercentage > 0 && progressPercentage < 100 && (
      <Image 
        source={Bike} 
        style={[
          styles.bikeImage,
          { left: `${progressPercentage}%` }
        ]}
      />
    )}
  </View>
  <Text style={styles.progressText}>{progressPercentage}% Completed</Text>
</View>    
            <View style={styles.statusCirclesContainer}>
              {allStatuses.map((status, index) => {
                const isCompleted = isStatusCompleted(status.id);
                const isCurrent = status.id === currentStatus;
                
                return (
                  <View key={status.id} style={styles.statusItem}>
                    <View style={[
                      styles.statusCircleWrapper,
                      isCompleted ? { borderColor: status.color } : null,
                      isCurrent ? styles.currentCircleWrapper : null
                    ]}>
                      <View style={[
                        styles.statusCircle,
                        isCompleted ? { backgroundColor: status.color } : styles.incompleteCircle
                      ]}>
                        <Icon 
                          name={status.icon} 
                          size={20} 
                          color={isCompleted ? "#FFFFFF" : "#ADB2D4"} 
                        />
                      </View>
                    </View>
                    {index < allStatuses.length - 1 && (
                      <View style={[
                        styles.connector,
                        isStatusCompleted(allStatuses[index].id) 
                          ? { backgroundColor: status.color }
                          : styles.incompleteConnector
                      ]} />
                    )}      
                    <Text style={[
                      styles.statusLabel,
                      isCurrent ? { color: status.color, fontWeight: 'bold' } : null
                    ]}>
                      {status.label}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.currentStatusContainer}>
              <View style={[styles.currentStatusIconCircle, { backgroundColor: allStatuses.find(s => s.id === currentStatus)?.color || '#46345B' }]}>
                <Icon 
                  name={allStatuses.find(s => s.id === currentStatus)?.icon || 'help-circle-outline'} 
                  size={28} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.currentStatusTextContainer}>
                <Text style={styles.currentStatusLabel}>Current Status</Text>
                <Text style={styles.currentStatusName}>{statusName}</Text>
                <Text style={styles.currentStatusDescription}>
                  {allStatuses.find(s => s.id === currentStatus)?.description || 'Processing your order'}
                </Text>
              </View>
            </View>
          </View>
        )}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.divider} />
          
          {summaryLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#46345B" />
              <Text style={styles.loadingText}>Loading order details...</Text>
            </View>
          ) : orderSummary.length === 0 ? (
            <Text style={styles.noItemsText}>No items found in this order.</Text>
          ) : (
            <>
              {Object.entries(groupedItems).map(([key, items]) => {
                const dressInfo = items[0];
                const imageFileName = getDressTypeImage(dressInfo.DressTypeId) || dressInfo.ImageFileName;
                return (
                  <View key={key} style={styles.dressTypeContainer}>
                    <View style={styles.dressImageContainer}>
                      {imageFileName ? (
                        <Image 
                          source={{ uri: `${imagePath}${imageFileName}` }}
                          style={styles.dressImage}
                        />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <Icon name="shirt-outline" size={48} color="#ADB2D4" />
                        </View>
                      )}
                    </View>
                    <View style={styles.dressInfoContainer}>
                      <Text style={styles.dressTypeName}>{dressInfo.DressTypeName}</Text>
                      {items.map((item, index) => (
                        <View key={index} style={styles.serviceItem}>
                          <View style={styles.serviceRow}>
                            <Text style={styles.serviceName}>{item.ServiceName}</Text>
                            <Text style={styles.serviceQuantity}>x{item.Quantity}</Text>
                          </View>
                          <View style={styles.priceRow}>
                            <Text style={styles.unitPriceText}>
                              Unit: {formatCurrency(item.UnitPrice)}
                            </Text>
                            <Text style={styles.totalPriceText}>
                              {formatCurrency(item.TotalPrice)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Bill</Text>
                <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
              </View>
            </>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <View style={styles.divider} />
          <Text style={styles.addressText}>{orderDetails?.Address1} {orderDetails?.FullAddress || 'Address not available'}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={contactButtonPress}
          >
            <Icon name="call-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Contact</Text>
          </TouchableOpacity>
          {!isCancelled && currentStatus < 2 && (
            <TouchableOpacity 
              style={[styles.cancelButton, isLoading && styles.disabledButton]}
              onPress={handleCancelOrder}
              disabled={isLoading}
            >
              <Icon name="close-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>{isLoading ? "Cancelling..." : "Cancel Order"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    marginRight: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5761A'
  },
  orderSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#46345B'
  },
  order:{
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2598d3'
  },
  orderDate: {
    color: '#73788B',
    marginTop: 4,
    fontSize: 14
  },
  deliveryEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F0F2F5',
    padding: 12,
    borderRadius: 10
  },
  deliveryText: {
    marginLeft: 8,
    color: '#46345B',
    fontWeight: '500'
  },
  cancelledBadge: {
    backgroundColor: '#ffcccc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  cancelledText: {
    color: '#cc0000',
    fontWeight: 'bold',
    fontSize: 12
  },
  cancelledCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cancelledTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#46345B',
    marginTop: 16
  },
  cancelledDescription: {
    textAlign: 'center',
    color: '#73788B',
    marginTop: 8,
    lineHeight: 22
  },
  trackingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#46345B'
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F2F5',
    marginVertical: 16
  },
  progressContainer: {
    marginBottom: 20,
    marginTop: 30,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#46345B',
    borderRadius: 5,
  },
  progressText: {
    textAlign: 'right',
    color: '#73788B',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  statusCirclesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative'
  },
  statusCircleWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  currentCircleWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
  },
  statusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#46345B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incompleteCircle: {
    backgroundColor: '#F0F2F5',
  },
  connector: {
    position: 'absolute',
    left: '50%',
    top: 23,
    height: 2,
    width: '100%',
    backgroundColor: '#46345B',
    zIndex: -1
  },
  incompleteConnector: {
    backgroundColor: '#E0E0E0'
  },
  statusLabel: {
    fontSize: 12,
    color: '#73788B',
    marginTop: 8,
    textAlign: 'center'
  },
  currentStatusContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  currentStatusIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#46345B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  currentStatusTextContainer: {
    flex: 1
  },
  currentStatusLabel: {
    fontSize: 12,
    color: '#73788B',
    marginBottom: 2
  },
  currentStatusName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 4
  },
  currentStatusDescription: {
    fontSize: 14,
    color: '#73788B',
    lineHeight: 20
  },
  statusIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#73788B',
    marginTop: 12,
    fontSize: 16,
  },
  noItemsText: {
    color: '#73788B',
    fontSize: 16,
    textAlign: 'center',
    padding: 16,
  },
  dressTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  dressImageContainer: {
    width: 100,
    marginRight: 16,
  },
  dressImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F0F2F5',
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dressInfoContainer: {
    flex: 1,
  },
  dressTypeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 4,
  },
  dressDescription: {
    fontSize: 13,
    color: '#73788B',
    marginBottom: 12,
  },
  serviceItem: {
    marginBottom: 8,
    paddingVertical: 6,
    backgroundColor: '#F8F9FF',
    borderRadius: 8,
    padding: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 14,
    color: '#46345B',
    fontWeight: '500',
  },
  serviceQuantity: {
    fontSize: 14,
    color: '#73788B',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  unitPriceText: {
    fontSize: 12,
    color: '#73788B',
  },
  totalPriceText: {
    fontSize: 14,
    color: '#46345B',
    fontWeight: 'bold',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#46345B',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#46345B',
  },
  addressText: {
    fontSize: 15,
    color: '#46345B',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 24,
    marginBottom: 80
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#2598d3',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    alignItems: 'center',
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#73788B',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalCloseButton: {
    backgroundColor: '#46345B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bikeImage: {
    position: 'absolute',
    width: 40,
    height: 40,
    bottom: 12,
    marginLeft: -20, 
    zIndex: 1,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'visible',
    position: 'relative', 
  },
});

export default TrackOrder;