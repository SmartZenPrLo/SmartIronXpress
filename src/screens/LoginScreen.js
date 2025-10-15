import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Easing,
  Modal,
  Image,
  Linking,
  Alert,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons'; 
import FontAwesome from '@react-native-vector-icons/fontawesome';
import { API_LOGIN_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CountryPicker } from 'react-native-country-codes-picker';
import AppIcon from '../../assets/AppIconi.png';
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';

const { width, height } = Dimensions.get('window');
const BUSINESS_APP_LINK = 'https://play.google.com/store/apps/details?id=com.smartlaundrybusiness&pcampaignid=web_share';

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countryCode, setCountryCode] = useState('');
  const [countryFlag, setCountryFlag] = useState('🌍');
  const [countryError, setCountryError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const navigation = useNavigation();

  // Bubble animation component
  const Bubble = ({ delay, size, left, bottom, opacity }) => {
    const bubbleAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      const animateBubble = () => {
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(bubbleAnim, {
            toValue: 1,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.delay(Math.random() * 2000)
        ]).start(() => {
          bubbleAnim.setValue(0);
          animateBubble();
        });
      };
      
      animateBubble();
      
      return () => bubbleAnim.stopAnimation();
    }, []);

    const randomOffset = Math.random() * 80 - 40;

    const bubbleStyle = {
      opacity: bubbleAnim.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [0, opacity, opacity, 0],
      }),
      transform: [
        { 
          translateY: bubbleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -height * 0.6],
          }) 
        },
        { 
          translateX: bubbleAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, randomOffset, randomOffset * 0.5],
          }) 
        },
        { 
          scale: bubbleAnim.interpolate({
            inputRange: [0, 0.3, 0.7, 1],
            outputRange: [0.3, 1, 1, 0.3],
          }) 
        },
      ],
      position: 'absolute',
      left: left,
      bottom: bottom,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: `rgba(245, 118, 26, ${opacity})`,
    };

    return <Animated.View style={bubbleStyle} />;
  };

  // Generate bubbles with better distribution
  const renderBubbles = () => {
    const bubbles = [];
    const bubbleCount = 8;
    
    for (let i = 0; i < bubbleCount; i++) {
      const size = 15 + (i % 3) * 10;
      const left = Math.random() * (width - size);
      const bottom = -50 - (Math.random() * 100);
      const opacity = 0.2 + (i * 0.1);
      const delay = i * 500;

      bubbles.push(
        <Bubble
          key={i}
          delay={delay}
          size={size}
          left={left}
          bottom={bottom}
          opacity={opacity}
        />
      );
    }
    
    return bubbles;
  };

  const handleLogin = async () => {
    setErrorMessage('');
    setCountryError('');
    setPhoneError('');

    // Validate inputs
    if (!countryCode) {
      setCountryError('Please select country code');
      return;
    }
    
    if (!phoneNumber) {
      setPhoneError('Please enter phone number');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter password');
      return;
    }
    
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      console.log("Full Phone number--------------------", fullPhoneNumber);
    
      const fcmToken = await getFcmToken();
      console.log("FCM Token in Login---------------------", fcmToken);
      const deviceInfo = await getDeviceInfo();
      
      const response = await fetch(`${API_LOGIN_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: fullPhoneNumber, 
          password,
          fcmToken,
          deviceInfo
        }),
      });
      
      const data = await response.json();
      console.log("Data in Login---------------------", data);

      if (response.ok) {
        const userId = data.user?.UserId;
        const BranchID = data.user?.BranchID;
        console.log("User ID in login screen-----------------", userId);

        if (userId && BranchID) {
          await AsyncStorage.setItem('userId', userId.toString());
          await AsyncStorage.setItem('BranchID', BranchID.toString());
        }

        navigation.navigate('BottomTabNavigator');
      } else {
        setErrorMessage(data.message || 'Invalid credentials');
      }

    } catch (error) {
      setErrorMessage('Network error. Please try again.');
    }
  };

  const openBusinessApp = () => {
    Linking.canOpenURL(BUSINESS_APP_LINK).then(supported => {
      if (supported) {
        Linking.openURL(BUSINESS_APP_LINK);
      } else {
        Alert.alert(
          "App Store Not Available",
          "Cannot open the Play Store. Please search for 'Smart Iron Xpress' in the Play Store."
        );
      }
    });
  };

  useEffect(() => {
    requestUserPermission();
    getDeviceInfo();
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground Message received:', remoteMessage);
    });
    return unsubscribe;
  }, []);

  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
    if (enabled) {
      console.log('Authorization status:', authStatus);
      getFcmToken();
    } else {
      console.log('Notification permission denied');
    }
  };

  const getFcmToken = async () => {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      await AsyncStorage.setItem('fcmToken', token);
      return token;
    } catch (error) {
      console.log('Error getting FCM token:', error);
      return null;
    }
  };

  const getDeviceInfo = async () => {
    try {
      const deviceId = DeviceInfo.getUniqueId();
      const deviceName = await DeviceInfo.getDeviceName();
      const deviceModel = DeviceInfo.getModel();
      const deviceOS = DeviceInfo.getSystemName();
      const deviceOSVersion = DeviceInfo.getSystemVersion();
      const deviceInfo = {
        deviceId,
        deviceName,
        deviceModel,
        deviceOS,
        deviceOSVersion
      };
      console.log('Device Info:', deviceInfo);
      await AsyncStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));
      
      return deviceInfo;
    } catch (error) {
      console.log('Error getting device info:', error);
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#46345B" barStyle="light-content" />
      
      {/* Background Bubbles */}
      <View style={styles.bubblesContainer}>
        {renderBubbles()}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Image source={AppIcon} style={styles.appIcon} />
            </View>
            <Text style={styles.appName}>Smart Iron Xpress</Text>
<Text style={styles.tagline}>Perfectly Pressed, Just a Tap Away</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Country Code Selection - Top */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Country Code</Text>
              <TouchableOpacity 
                style={[
                  styles.countryCodeContainer,
                  countryError ? styles.inputError : null
                ]}
                onPress={() => setShowCountryPicker(true)}
              >
                <Icon name="call" size={20} color="#73788B" style={styles.countryCodeIcon} />
                <Text style={[
                  styles.countryCodeText,
                  !countryCode && styles.placeholderText
                ]}>
                  {countryCode ? `${countryFlag} ${countryCode}` : 'Choose your country code'}
                </Text>
                <Icon name="chevron-down" size={16} color="#73788B"/>
              </TouchableOpacity>
              {countryError ? <Text style={styles.errorText}>{countryError}</Text> : null}
            </View>

            {/* Phone Number Input - Bottom */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={[
                styles.phoneInputContainer,
                phoneError ? styles.inputError : null
              ]}>
                <FontAwesome 
                  name="whatsapp" 
                  color="#25D366" 
                  size={20} 
                  style={styles.phoneIcon}
                />
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#73788B"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setPhoneError('');
                  }}
                />
              </View>
            {phoneError ? (
  <Text style={styles.errorText}>{phoneError}</Text>
) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={22} color="#73788B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#73788B"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icon
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#73788B"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={() => navigation.navigate('PhoneNumber', { from: 'forget' })}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.orContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.divider} />
            </View>
          </View>

          {/* Footer Section */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Smart Iron Xpress?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PhoneNumber', { from: 'register' })}>
              <Text style={styles.registerText}>Register</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Country Picker Modal */}
      <CountryPicker
        show={showCountryPicker}
        pickerButtonOnPress={(item) => {
          setCountryCode(item.dial_code);
          setCountryFlag(item.flag);
          setCountryError('');
          setShowCountryPicker(false);
        }}
        onBackdropPress={() => setShowCountryPicker(false)}
        style={{
          modal: {
            height: 400,
            backgroundColor: '#FFFFFF',
          },
          countryButtonStyles: {
            borderColor: '#ADB2D4',
          },
          searchMessageText: {
            color: '#46345B',
          },
        }}
        searchPlaceholder="Search country"
        lang="en"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  bubblesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  keyboardView: {
    flex: 1,
    zIndex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ADB2D4',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  appIcon: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#73788B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#46345B',
    marginBottom: 8,
    marginLeft: 4,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ADB2D4',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  countryCodeIcon: {
    marginRight: 12,
  },
  countryCodeText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  placeholderText: {
    color: '#73788B',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ADB2D4',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  phoneIcon: {
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    color: '#000000',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ADB2D4',
    borderRadius: 12,
    height: 56,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#000000',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#F5761A',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#F5761A',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#F5761A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ADB2D4',
  },
  orText: {
    color: '#73788B',
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
    paddingHorizontal: 30,
  },
  footerText: {
    fontSize: 16,
    color: '#73788B',
  },
  registerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5761A',
    marginLeft: 8,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'left',
    marginTop: 4,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#73788B',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default LoginScreen;