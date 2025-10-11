import React, { useState, useRef, useEffect } from 'react'; 
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Switch,
  Platform,
  PermissionsAndroid,
  BackHandler,
  Modal,
  Linking,
  Alert,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { request, PERMISSIONS, RESULTS, check, openSettings } from 'react-native-permissions';
import Icon from '@react-native-vector-icons/ionicons';

const { width } = Dimensions.get('window');
const SettingsGuidanceModal = ({ visible, onClose, permissionType }) => {
  const permissionMessages = {
    location: {
      title: "Location Permission Required",
      message: "To use location features, please enable location permissions in your device settings.",
      icon: "location"
    },
    notifications: {
      title: "Notification Permission Required",
      message: "To receive important updates about your Ironing, please enable notification permissions in your device settings.",
      icon: "notifications"
    }
  };

  const message = permissionType ? permissionMessages[permissionType] : permissionMessages.location;

  const handleOpenSettings = () => {
    Linking.openSettings();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Icon name={message.icon} color="#46345B" size={64} style={styles.modalIcon} />
          <Text style={styles.modalTitle}>{message.title}</Text>
          <Text style={styles.modalText}>
            {message.message}
          </Text>
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalSecondaryButton]} 
              onPress={onClose}
            >
              <Text style={styles.modalSecondaryButtonText}>Later</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleOpenSettings}
            >
              <Text style={styles.modalButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const PermissionErrorModal = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Icon name="warning" color="#FF6B6B" size={64} style={styles.modalIcon} />
          <Text style={styles.modalTitle}>Permissions Required</Text>
          <Text style={styles.modalText}>
            Please allow at least one permission to continue using Smart Iron Xpress.
          </Text>
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const TermsScreen = () => {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState({
    location: false,
    notifications: false
  });
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [currentPermission, setCurrentPermission] = useState(null);
  const navigation = useNavigation();
  const scrollProgress = useRef(new Animated.Value(0)).current;
  const appState = useRef(AppState.currentState);
  
  useEffect(() => {
    checkExistingPermissions();
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground - rechecking permissions');
        checkExistingPermissions();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      checkExistingPermissions();
      return () => {};
    }, [])
  );

  const isAndroid13OrHigher = () => {
    if (Platform.OS !== 'android') return false;
    return Platform.Version >= 33;
  };

  const checkExistingPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const locationResult = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        let notificationResult = false;
        if (isAndroid13OrHigher()) {
          notificationResult = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        }
        
        console.log('Permission check results - Location:', locationResult, 'Notifications:', notificationResult);
        
        setPermissionStatus({
          location: locationResult,
          notifications: notificationResult
        });
      } else {
        const locationResult = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        const notificationResult = await check(PERMISSIONS.IOS.NOTIFICATIONS);
        
        setPermissionStatus({
          location: locationResult === RESULTS.GRANTED,
          notifications: notificationResult === RESULTS.GRANTED
        });
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
    }
  };

  const permissions = [
    {
      id: 'location',
      title: 'Location',
      description: 'Find nearby Ironing facilities, get directions, and receive location-based offers',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Receive alerts and updates about your Ironing status',
    }
  ];

  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;
    const progress = scrollY / (contentHeight - layoutHeight);
    scrollProgress.setValue(progress > 1 ? 1 : progress < 0 ? 0 : progress);
    const isScrolledToBottom = layoutHeight + scrollY >= contentHeight - 20;
    setScrolledToBottom(isScrolledToBottom);
  };

  const showSettingsPrompt = (permissionId) => {
    setCurrentPermission(permissionId);
    setSettingsModalVisible(true);
  };

  const requestLocationPermission = async () => {
    try {
      let result;
      if (Platform.OS === 'android') {
        result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (result === PermissionsAndroid.RESULTS.DENIED || 
            result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          showSettingsPrompt('location');
        }
        
        const isGranted = result === PermissionsAndroid.RESULTS.GRANTED;
        console.log('Location permission result:', result, 'Granted:', isGranted);
        
        setPermissionStatus(prev => ({
          ...prev,
          location: isGranted
        }));
        
        return isGranted;
      } else {
        result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        
        if (result === RESULTS.DENIED || 
            result === RESULTS.BLOCKED || 
            result === RESULTS.LIMITED) {
          showSettingsPrompt('location');
        }
        
        const isGranted = result === RESULTS.GRANTED;
        
        setPermissionStatus(prev => ({
          ...prev,
          location: isGranted
        }));
        
        return isGranted;
      }
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      setPermissionStatus(prev => ({
        ...prev,
        location: false
      }));
      return false;
    }
  };
  
  const requestNotificationPermission = async () => {
    try {
      let result;
      
      if (Platform.OS === 'android') {
        if (!isAndroid13OrHigher()) {
          console.log('Android version below 13, skipping notification permission');
          setPermissionStatus(prev => ({
            ...prev,
            notifications: true
          }));
          return true;
        }
        
        result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        
        if (result === PermissionsAndroid.RESULTS.DENIED || 
            result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          showSettingsPrompt('notifications');
        }
        
        const isGranted = result === PermissionsAndroid.RESULTS.GRANTED;
        console.log('Notification permission result:', result, 'Granted:', isGranted);
        
        setPermissionStatus(prev => ({
          ...prev,
          notifications: isGranted
        }));
        
        return isGranted;
      } else {
        result = await request(PERMISSIONS.IOS.NOTIFICATIONS);
        
        if (result === RESULTS.DENIED || 
            result === RESULTS.BLOCKED) {
          showSettingsPrompt('notifications');
        }
        
        const isGranted = result === RESULTS.GRANTED;
        
        setPermissionStatus(prev => ({
          ...prev,
          notifications: isGranted
        }));
        
        return isGranted;
      }
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      setPermissionStatus(prev => ({
        ...prev,
        notifications: false
      }));
      return false;
    }
  };
  
  const togglePermission = async (id, value) => {
    if (value) {
      let granted = false;
      if (id === 'location') {
        granted = await requestLocationPermission();
      } else if (id === 'notifications') {
        granted = await requestNotificationPermission();
      }
      if (!granted) {
        setTimeout(() => {
          checkExistingPermissions();
        }, 500);
      }
    } else {
      Alert.alert(
        `Disable ${id.charAt(0).toUpperCase() + id.slice(1)}`,
        `To fully disable ${id} permission, please go to device settings.`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Open Settings", 
            onPress: () => {
              Linking.openSettings();
            }
          }
        ]
      );
    }
  };
  
  const handleAccept = () => {
    const hasAnyPermission = Object.values(permissionStatus).some(status => status === true);
    
    if (hasAnyPermission) {
      navigation.navigate("LoginScreen");
    } else {
      setIsErrorModalVisible(true);
    }
  };

  const progressWidth = scrollProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <PermissionErrorModal 
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
      />
      <SettingsGuidanceModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        permissionType={currentPermission}
      />
      <View style={styles.header}>
        <Text style={styles.headerText}>Terms & Privacy</Text>
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              { width: progressWidth }
            ]} 
          />
        </View>
      </View>
      <View style={styles.welcomeSection}>
        <Icon name="shield-checkmark" color="#FFFFFF" size={64} style={styles.welcomeIcon} />
        <Text style={styles.welcomeTitle}>Welcome to Smart Iron Xpress</Text>
        <Text style={styles.welcomeSubtitle}>A more convenient way to do Ironing</Text>
      </View>
      <ScrollView 
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.contentSection}>
          <Text style={styles.contentText}>
            To provide you with the best experience, we need access to certain features on your device. 
            Before you start using Smart Iron Xpress, please review our terms and privacy policy.
          </Text>
        </View>
        <View style={styles.permissionsSection}>
          <Text style={styles.sectionTitle}>App Permissions</Text>
          {permissions.map((permission) => (
            <View key={permission.id} style={styles.permissionItem}>
              <View style={styles.permissionContent}>
                <View style={styles.permissionTitleRow}>
                  <Text style={styles.permissionTitle}>{permission.title}</Text>
                  <Switch
                    trackColor={{ false: "#D1D1D6", true: "#ADB2D4" }}
                    thumbColor={permissionStatus[permission.id] ? "#46345B" : "#F4F3F4"}
                    ios_backgroundColor="#D1D1D6"
                    onValueChange={(value) => togglePermission(permission.id, value)}
                    value={permissionStatus[permission.id]}
                  />
                </View>
                <Text style={styles.permissionDescription}>{permission.description}</Text>
                <View style={styles.permissionStatusContainer}>
                  <Text style={[
                    styles.permissionStatus,
                    permissionStatus[permission.id] ? styles.permissionGranted : styles.permissionDenied
                  ]}>
                    {permissionStatus[permission.id] ? 'Access allowed' : 'Access not allowed'}
                  </Text>
                  {!permissionStatus[permission.id] && (
                    <TouchableOpacity onPress={() => showSettingsPrompt(permission.id)}>
                      <Text style={styles.goToSettingsText}>Go to settings</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>How we use your data</Text>
          <Text style={styles.contentText}>
            We value your privacy and are committed to protecting your personal information. Data collected is used to:
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletPoint}>• Provide and improve our Ironing services</Text>
            <Text style={styles.bulletPoint}>• Personalize your experience</Text>
            <Text style={styles.bulletPoint}>• Send the bill to be paid</Text>
            <Text style={styles.bulletPoint}>• Send you updates and notifications</Text>
            <Text style={styles.bulletPoint}>• Respond to your support requests</Text>
          </View>
        </View>
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Your control</Text>
          <Text style={styles.contentText}>
            You can manage these permissions at any time in your device settings. You can also request deletion of your data
            through the app or by contacting our support team at info@smartzensolutions.com.
          </Text>
        </View>
        <View style={styles.contentSection}>
          <Text style={styles.contentText}>
            By tapping "I agree" below, you acknowledge that you have read and understood our 
            <Text style={styles.linkText}> Terms of Service</Text> and 
            <Text style={styles.linkText}> Privacy Policy</Text>.
          </Text>
        </View>
        <View style={styles.spacer} />
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          activeOpacity={0.7}
          onPress={() => BackHandler.exitApp()}
        >
          <Text style={styles.backButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.nextButton, 
            !scrolledToBottom && styles.disabledButton
          ]}
          activeOpacity={0.7}
          onPress={handleAccept}
          disabled={!scrolledToBottom}
        >
          <Text style={styles.nextButtonText}>I agree</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#202124',
    textAlign: 'center',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    marginTop: 12,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F5761A',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 24,
    backgroundColor: '#F5761A',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#E0F7FF',
  },
  contentSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5F6368',
  },
  permissionsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  permissionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  permissionContent: {
    flex: 1,
    marginLeft: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#202124',
  },
  permissionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5F6368',
    marginBottom: 6,
  },
  permissionStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionStatus: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  permissionGranted: {
    color: '#4CAF50',
  },
  permissionDenied: {
    color: '#85929E',
  },
  goToSettingsText: {
    fontSize: 12,
    color: '#46345B',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  bulletPoints: {
    marginTop: 12,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5F6368',
    marginBottom: 8,
  },
  linkText: {
    color: '#46345B',
    textDecorationLine: 'underline',
  },
  spacer: {
    height: 40,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  nextButton: {
    backgroundColor: '#F5761A',
  },
  disabledButton: {
    backgroundColor: 'rgba(245, 117, 26, 0.52)',
    opacity: 0.8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5F6368',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  welcomeIcon: {
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#5F6368',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: '#46345B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  modalSecondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#46345B',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalSecondaryButtonText: {
    color: '#46345B',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TermsScreen;