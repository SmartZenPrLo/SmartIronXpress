import React, { useState, useEffect, useRef } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
  Easing,
  Image,
  Platform
} from 'react-native';
import Icon from '@react-native-vector-icons/fontawesome';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_USER_INFO_URL, API_LAUNDRY_ORDER_URL, API_PRICE_LIST_URL, API_LAUNDRY_SLOT_READ, API_LAUNDRY_SCHEDULE_READ } from '../api';
import { API_BASE_URL } from '../config';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const getCurrencySymbol = (currencyCode) => {
  const currencyMap = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹', 'AED': 'د.إ',
    // ... keep your existing currency map
  };
  return currencyMap[currencyCode] || currencyCode;
};

const PlaceOrderScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { laundry, selectedSlot } = route.params || {};
  const [userId, setUserId] = useState(null);
  const [BranchID, setBranchID] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [error, setError] = useState(null);
  const [priceList, setPriceList] = useState([]);
  
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [PaymentMethod, setPaymentMethod] = useState('');
  // Simplified modal animations
  const successModalAnim = useRef(new Animated.Value(0)).current;
  const errorModalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedBranchID = await AsyncStorage.getItem('BranchID');

      if (storedBranchID && storedBranchID !== 'null' && storedBranchID !== 'undefined') {
        setBranchID(storedBranchID);
      }
      setUserId(storedUserId);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) fetchUserData();
  }, [userId]);

  useEffect(() => {
    if (laundry?.CompanyId && BranchID) {
      fetchPriceDetails();
      fetchData();
    }
  }, [laundry, BranchID]);

  // Initialize cart items when price list loads
  useEffect(() => {
    if (priceList.length > 0) {
      const initialCartItems = [];
      priceList.forEach(serviceGroup => {
        serviceGroup.items.forEach(item => {
          initialCartItems.push({
            id: item.ID,
            dressTypeId: item.DressTypeId,
            serviceId: item.ServiceId,
            dressTypeName: item.DressTypeName,
            serviceName: item.ServiceName,
            description: item.Description,
            imageFileName: item.ImageFileName,
            price: parseFloat(item.Price),
            currency: item.Currency,
            quantity: 0,
            unitPrice: parseFloat(item.Price),
            isActive: 1
          });
        });
      });
      setCartItems(initialCartItems);
    }
  }, [priceList]);

  // Calculate total amount
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    setTotalAmount(total);
  }, [cartItems]);

  const updateQuantity = (id, change) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.max(0, item.quantity + change) } 
          : item
      )
    );
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_USER_INFO_URL}/${userId}`);
      const data = await response.json();
      console.log("API_USER_INFO_URL-=--=-=-=-=-=-=-=-=-=-",data);
      if (response.ok) {
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    const companyId = laundry?.CompanyId || laundry?.CompanyID;
    if (!companyId) return;

    try {
      setLoading(true);
      const [schedulesRes, slotsRes] = await Promise.all([
        fetch(API_LAUNDRY_SCHEDULE_READ),
        fetch(`${API_LAUNDRY_SLOT_READ}?CompanyID=${companyId}`)
      ]);

      const [schedulesData, slotsData] = await Promise.all([
        schedulesRes.json(),
        slotsRes.json()
      ]);

      const activeSlots = slotsData.filter(slot => slot.IsActive);
      const availableScheduleIds = new Set(activeSlots.map(slot => slot.ScheduleID));
      const available = schedulesData.filter(
        schedule => schedule.IsActive && availableScheduleIds.has(schedule.ScheduleID)
      );

      setAllSchedules(schedulesData);
      setAvailableSlots(available);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceDetails = async () => {
    try {
      setLoading(true);
      if (!laundry?.CompanyId || !BranchID) {
        throw new Error('Laundry company ID or BranchID is missing');
      }

      const url = `${API_PRICE_LIST_URL}?CompanyId=${encodeURIComponent(laundry.CompanyId)}&BranchID=${encodeURIComponent(BranchID)}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error('No Price details found');

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Invalid data format');

      // Set default currency and price list
      const currencyCounts = {};
      data.forEach(item => {
        currencyCounts[item.Currency] = (currencyCounts[item.Currency] || 0) + 1;
      });
      
      let mostCommonCurrency = 'INR';
      let highestCount = 0;
      for (const [currency, count] of Object.entries(currencyCounts)) {
        if (count > highestCount) {
          mostCommonCurrency = currency;
          highestCount = count;
        }
      }
      
      setDefaultCurrency(mostCommonCurrency);
      const groupedItems = data.reduce((groups, item) => {
        const key = item.ServiceId;
        if (!groups[key]) {
          groups[key] = {
            serviceId: item.ServiceId,
            serviceName: item.ServiceName,
            items: []
          };
        }
        groups[key].items.push(item);
        return groups;
      }, {});
      
      setPriceList(Object.values(groupedItems));
      
    } catch (error) {
      console.error('Error fetching price list:', error);
      setErrorMessage(error.message || 'Failed to load service prices. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const selectedItems = cartItems.filter(item => item.quantity > 0);
    if (selectedItems.length === 0) {
      setErrorMessage('Please select at least one item to place an order.');
      setErrorModalVisible(true);
      return;
    }

    if (!userId || !BranchID || !laundry?.CompanyId || !selectedSchedule || !selectedDate || !PaymentMethod) {
      setErrorMessage('Missing required information. Please fill all fields.');
      setErrorModalVisible(true);
      return;
    }

    try {
      setSubmitting(true);

      const orderData = {
        userId: userId,
        BranchID: BranchID,
        companyId: laundry.CompanyId,
        pickupSlot: selectedSchedule,
        pickupDate: selectedDate.toISOString().split('T')[0],
        totalAmount: totalAmount,
        PaymentMethod: PaymentMethod,
        orderDetails: selectedItems.map(item => ({
          dressTypeId: item.dressTypeId,
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          isActive: item.isActive
        }))
      };

      console.log('Submitting order data:', orderData);

      const response = await fetch(API_LAUNDRY_ORDER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessModalVisible(true);
      } else {
        setErrorMessage(result.message || 'Failed to place order. Please try again.');
        setErrorModalVisible(true);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Fixed modal handlers
  const handleErrorModalDismiss = () => {
    Animated.timing(errorModalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setErrorModalVisible(false));
  };

  const handleSuccessDone = () => {
    Animated.timing(successModalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSuccessModalVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'BottomTabNavigator' }]
      });
    });
  };

  // Animate modals when they become visible
  useEffect(() => {
    if (successModalVisible) {
      Animated.timing(successModalAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [successModalVisible]);

  useEffect(() => {
    if (errorModalVisible) {
      Animated.timing(errorModalAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [errorModalVisible]);

  const isToday = (someDate) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  };

  const isSlotAfterNow = (slotTime) => {
    const now = new Date();
    const [startTime] = slotTime.split(' to ');
    const slotDate = new Date(selectedDate);
    const [time, modifier] = startTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate > now;
  };

  const filteredSlots = availableSlots.filter((slot) => {
    if (!slot.Schedule) return false;
    if (!selectedDate) return false;
    if (isToday(selectedDate)) {
      return isSlotAfterNow(slot.Schedule);
    }
    return true;
  });

  const renderServiceItems = (serviceGroup) => {
    return serviceGroup.items.map((item) => {
      const cartItem = cartItems.find(cartItem => cartItem.id === item.ID);
      
      return (
        <View key={item.ID} style={styles.serviceItemContainer}>
          <View style={styles.serviceItemInfo}>
            <View style={styles.imageContainer}>
              {item.ImageFileName ? (
                <Image 
                  source={{ uri: `${API_BASE_URL}/uploads/dress/${item.ImageFileName}` }} 
                  style={styles.itemImage} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Icon name="tshirt" size={24} color="#46345B" />
                </View>
              )}
            </View>
            <View style={styles.itemDetailsContainer}>
              <Text style={styles.itemName}>{item.DressTypeName}</Text>
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.Description || 'No description available'}
              </Text>
              <Text style={styles.itemPrice}>
                {getCurrencySymbol(item.Currency)} {parseFloat(item.Price).toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.ID, -1)}
              disabled={!cartItem || cartItem.quantity === 0}
            >
              <Icon name="minus" size={14} color={!cartItem || cartItem.quantity === 0 ? "#ccc" : "#46345B"} />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>
              {cartItem ? cartItem.quantity : 0}
            </Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.ID, 1)}
            >
              <Icon name="plus" size={14} color="#F5761A" />
            </TouchableOpacity>
          </View>
        </View>
      );
    });
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Place Order</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#46345B" />
          <Text style={styles.loadingText}>Loading your information...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.laundryCard}>
            <Text style={styles.sectionTitle}>Selected Laundry</Text>
            <Text style={styles.laundryName}>{laundry?.CompanyName}</Text>
            <Text style={styles.laundryAddress}>
              <Icon name="map-marker" size={14} color="#46345B" /> {laundry?.FullAddress}
            </Text>
            <Text style={styles.laundryContact}>
              <Icon name="phone" size={14} color="#46345B" /> {laundry?.PhoneNumber}
            </Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Information</Text>
            <View style={styles.userInfoContainer}>
              <View style={styles.iconContainer}>
                <Icon name="user" size={20} color="#46345B" />
              </View>
              <View style={styles.userInfoContent}>
                <Text style={styles.userInfoLabel}>Name</Text>
                <Text style={styles.userInfoValue}>{userData?.Username}</Text>
              </View>
            </View>
            <View style={styles.userInfoContainer}>
              <View style={styles.iconContainer}>
                <Icon name="home" size={20} color="#46345B" />
              </View>
              <View style={styles.userInfoContent}>
                <Text style={styles.userInfoLabel}>Pickup Address</Text>
                <Text style={styles.userInfoValue}>{userData?.Address1} {userData?.FullAddress}</Text>
              </View>
            </View>
            <View style={styles.userInfoContainer}>
              <View style={styles.iconContainer}>
                <Icon name="phone" size={20} color="#46345B" />
              </View>
              <View style={styles.userInfoContent}>
                <Text style={styles.userInfoLabel}>Phone Number</Text>
                <Text style={styles.userInfoValue}>{userData?.PhoneNo}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Service Prices</Text>
            {priceList.length > 0 ? (
              priceList.map((serviceGroup) => (
                <View key={serviceGroup.serviceId} style={styles.serviceGroupContainer}>
                  <Text style={styles.serviceName}>
                    <Icon name="magic" size={16} color="#46345B" /> {serviceGroup.serviceName}
                  </Text>
                  {renderServiceItems(serviceGroup)}
                </View>
              ))
            ) : (
              <View style={styles.noServicesContainer}>
                <Text style={styles.noServicesText}>No services available for this laundry service.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
      
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>
            {getCurrencySymbol(defaultCurrency)} {totalAmount.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.placeOrderButton, (submitting || loading || totalAmount === 0) && styles.disabledButton]}
          onPress={() => setShowScheduleModal(true)}
          disabled={submitting || loading || totalAmount === 0}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="truck" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.placeOrderText}>Request Pickup</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Schedule Selection Modal */}
<Modal
  visible={showScheduleModal}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setShowScheduleModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Select a Pickup Date</Text>

      <TouchableOpacity
        style={styles.scheduleOption}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.scheduleText}>
          {selectedDate.toDateString()}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (Platform.OS === 'android') {
              if (event.type === 'set' && date) {
                setSelectedDate(date);
              }
            } else {
              if (date) {
                setSelectedDate(date);
              }
            }
          }}
        />
      )}

      <Text style={[styles.modalTitle, { marginTop: 10 }]}>Select a Pickup Slot</Text>

      {availableSlots.length === 0 ? (
        <TouchableOpacity
          style={[
            styles.scheduleOption,
            selectedSchedule === '0' && styles.selectedScheduleOption,
          ]}
          onPress={() => setSelectedSchedule('0')}
        >
          <Text style={styles.scheduleText}>8:30 AM to 10:00 PM</Text>
        </TouchableOpacity>
      ) : filteredSlots.length === 0 ? (
        <Text style={styles.scheduleText1}>No slots available, select another date</Text>
      ) : (
        filteredSlots.map((slot, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.scheduleOption,
              selectedSchedule === slot.ScheduleID && styles.selectedScheduleOption,
            ]}
            onPress={() => setSelectedSchedule(slot.ScheduleID)}
          >
            <Text style={styles.scheduleText}>
              {slot.Schedule || 'No Slot Available'}
            </Text>
          </TouchableOpacity>
        ))
      )}

      {/* Prepaid/Postpaid Option */}
      <Text style={[styles.modalTitle, { marginTop: 10 }]}>Select Payment Method</Text>
      <View style={styles.paymentOptionsContainer}>
        <TouchableOpacity
          style={[
            styles.paymentOption,
            PaymentMethod === 'prepaid' && styles.selectedPaymentOption,
          ]}
          onPress={() => setPaymentMethod('prepaid')}
        >
          <Text style={styles.paymentText}>Prepaid</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.paymentOption,
            PaymentMethod === 'postpaid' && styles.selectedPaymentOption,
          ]}
          onPress={() => setPaymentMethod('postpaid')}
        >
          <Text style={styles.paymentText}>Postpaid</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={() => {
          if (!selectedSchedule || !selectedDate || !PaymentMethod) {
            setErrorMessage('Please select a pickup date, slot, and payment method');
            setErrorModalVisible(true);
            return;
          }
          setShowScheduleModal(false);
          handleSubmit();
        }}
      >
        <Text style={styles.submitButtonText}>Confirm and Submit</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      {/* Success Modal - Fixed */}
      <Modal
        transparent={true}
        visible={successModalVisible}
        animationType="fade"
        onRequestClose={handleSuccessDone}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.successModalContainer,
              {
                opacity: successModalAnim,
                transform: [{
                  scale: successModalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              }
            ]}
          >
            <View style={styles.successIconContainer}>
              <View style={styles.iconCircle}>
                <Icon name="check" size={40} color="#fff" />
              </View>
            </View>
            
            <Text style={styles.successTitle}>
              Order Placed Successfully!
            </Text>
            
            <Text style={styles.successMessage}>
              Your order has been placed with {laundry?.CompanyName}. They will contact you shortly.
            </Text>
            
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={handleSuccessDone}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
      
      {/* Error Modal - Fixed */}
      <Modal
        transparent={true}
        visible={errorModalVisible}
        animationType="fade"
        onRequestClose={handleErrorModalDismiss}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.errorModalContainer,
              {
                opacity: errorModalAnim,
                transform: [{
                  scale: errorModalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              }
            ]}
          >
            <View style={styles.errorIconContainer}>
              <View style={styles.errorIconCircle}>
                <Icon name="exclamation" size={40} color="#fff" />
              </View>
            </View>
            
            <Text style={styles.errorTitle}>
              Oops!
            </Text>
            
            <Text style={styles.errorMessage}>
              {errorMessage}
            </Text>
            
            <TouchableOpacity 
              style={styles.errorDoneButton}
              onPress={handleErrorModalDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.errorDoneButtonText}>Understood</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5761A',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholderButton: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  laundryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 12,
  },
  laundryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  laundryAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  laundryContact: {
    fontSize: 14,
    color: '#666',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfoContent: {
    flex: 1,
  },
  userInfoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  userInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  serviceGroupContainer: {
    marginBottom: 16,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#46345B',
    marginBottom: 8,
  },
  serviceItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  serviceItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  imageContainer: {
    width: 50,
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetailsContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#46345B',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#46345B',
  },
  placeOrderButton: {
    backgroundColor: '#F5761A',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F5761A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  noServicesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noServicesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 16,
    textAlign: 'center',
  },
  scheduleOption: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedScheduleOption: {
    backgroundColor:'rgba(245, 117, 26, 0.2)',
    borderColor: '#F5761A',
  },
  scheduleText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight:'bold',
  },
  scheduleText1: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 16,
  },
  submitButton: {
    backgroundColor: '#F5761A',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Success Modal styles
  successModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  doneButton: {
    backgroundColor: '#46345B',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 30,
    width: '100%',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Error Modal styles
  errorModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorDoneButton: {
    backgroundColor: '#f44336',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 30,
    width: '100%',
  },
  errorDoneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
    paymentOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentOption: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedPaymentOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default PlaceOrderScreen;