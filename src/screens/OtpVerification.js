import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Modal,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { OtpInput } from "react-native-otp-entry";
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_OTP_URL, API_VERIFY_OTP_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { width } = Dimensions.get('window');

const OtpVerification = () => {
  const navigation = useNavigation(); 
  const route = useRoute();
  const { phoneNumber, from , userId} = route.params;
  console.log("Phone Number and from in OTP Verification--------------------", phoneNumber, from);
  const lastTwoDigits = phoneNumber ? phoneNumber.slice(-2) : "**";
      const app = "customer";
    console.log("App in Phone number screen------------------", app);
  console.log(typeof app);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const otpInputRef = useRef(null);
  const [timer, setTimer] = useState(120);
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setIsTimerExpired(true);
    }
  }, [timer]);
  

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? `0${sec}` : sec}`;
  };


  
  useEffect(() => {
    if (showSuccessModal || showExpiredModal) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      const timer = setTimeout(() => {
        if (showSuccessModal) {
          setShowSuccessModal(false);
          if (from === 'register') {
            navigation.navigate('MapScreen', {phoneNumber});
          } else if (from === 'login') {
            navigation.navigate('BottomTabNavigator');
          }
          else if (from === 'forget') {
            navigation.navigate('ForgetPasswordScreen', {phoneNumber});
          }
        } else if (showExpiredModal) {
          setShowExpiredModal(false);
        }
      }, 2000);
  
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, showExpiredModal]);

  const handleVerifyOtp = async (enteredOtp) => {
    setError('');
    
    if (!enteredOtp || enteredOtp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    if (isTimerExpired) {
      setShowExpiredModal(true);
      return;
    }
  
    try {
      const response = await fetch(API_VERIFY_OTP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          otp: enteredOtp,
        }),
      });
  
      const data = await response.json();
      console.log("Data in the Verify API---------------------", data);
  
      if (response.ok && data.message === "OTP verified successfully.") {
           if (userId) {
          await AsyncStorage.setItem('userId', userId.toString());
        }
        console.log('OTP verified successfully:', data);
        setShowSuccessModal(true);
      } else {
        setError('Wrong OTP. Please try again.');
        console.log('OTP verification failed:', data.message);
      }
    } catch (error) {
      setError('Error verifying OTP. Please try again.');
      console.log('Error verifying OTP:', error);
    }
  };  
  
  const handleResendOtp = async () => {
    console.log('Resending OTP');
    setError('');
    setTimer(120);
    setOtp('');
    setIsTimerExpired(false);
    if (otpInputRef.current) {
      otpInputRef.current.clear();
    }
    try {
             const response = await fetch(`${API_OTP_URL}?phoneNumber=${phoneNumber}&app=${app}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      const data = await response.json();
      console.log("Resend OTP Response:", data);
  
      if (!response.ok) {
        setError("Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      setError("Error resending OTP. Please try again.");
      console.log("Error resending OTP:", error);
    }
  };  
  
  const SuccessCheckIcon = () => (
    <View style={styles.checkIconContainer}>
      <View style={styles.checkCircle}>
        <View style={styles.checkmark}/>
      </View>
    </View>
  );

  const ExpiredIcon = () => (
    <View style={styles.expiredIconContainer}>
      <View style={styles.expiredCircle}>
        <Text style={styles.expiredX}>X</Text>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titleText}>OTP Verification</Text>
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitleText}>
            We've sent a 6-digit OTP to your {' '}
          </Text>
          <Text style={styles.whatsappText}>WhatsApp</Text>
          <Text style={styles.subtitleText}> number ending with </Text>
          <Text style={styles.phoneDigits}>*****{lastTwoDigits}.</Text>
          {/* <Text style={styles.subtitleText}>Please enter it below.</Text> */}
        </View>
        <View style={styles.otpContainer}>
          <OtpInput
            ref={otpInputRef}
            numberOfDigits={6}
            onTextChange={(text) => {
              setOtp(text);
              if (text.length === 6) {
                handleVerifyOtp(text);
              }
            }}
            theme={{
              containerStyle: styles.otpInputContainer,
              pinCodeContainerStyle: styles.otpInputBox,
              pinCodeTextStyle: styles.otpInputText,
              focusStickStyle: styles.otpFocusStick
            }}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, isTimerExpired && styles.expiredTimerText]}>
            {timer > 0 
              ? `Resend OTP in ${formatTime(timer)}` 
              : "Time expired! Please resend OTP"}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.resendButton, timer > 0 && { opacity: 0.5 }]} 
          onPress={handleResendOtp}
          disabled={timer > 0}
        >
          <Text style={styles.resendButtonText}>Resend OTP</Text>
        </TouchableOpacity>
      </View>
      <Modal
        transparent={true}
        animationType="fade"
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalBackground}>
          <Animated.View 
            style={[
              styles.modalContainer,
              { 
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }] 
              }
            ]}
          >
            <SuccessCheckIcon />
            <Text style={styles.successText}>OTP Verified Successfully!</Text>
          </Animated.View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        animationType="fade"
        visible={showExpiredModal}
        onRequestClose={() => setShowExpiredModal(false)}
      >
        <View style={styles.modalBackground}>
          <Animated.View 
            style={[
              styles.modalContainer,
              { 
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }] 
              }
            ]}
          >
            <ExpiredIcon />
            <Text style={styles.expiredText}>OTP Time Expired!</Text>
            <Text style={styles.expiredSubText}>Please request a new OTP.</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#46345B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  subtitleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 25,
  },
  subtitleText: {
    color: '#ADB2D4',
  },
  whatsappText: {
    color: '#25D366',
    fontWeight: 'bold',
  },
  phoneDigits: {
    color: '#46345B',
    fontWeight: 'bold',
  },
  otpContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  otpInputContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  otpInputBox: {
    width: Math.min(45, (width - 100) / 6),
    height: Math.min(45, (width - 100) / 6),
    borderWidth: 1,
    borderColor: '#ADB2D4',
    borderRadius: 5,
    marginHorizontal: 3,
  },
  otpInputText: {
    color: '#000000',
    fontSize: 16,
    textAlign: 'center',
  },
  otpFocusStick: {
    borderColor: '#46345B',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  timerContainer: {
    marginBottom: 20,
  },
  timerText: {
    color: '#E53888',
  },
  expiredTimerText: {
    color: 'red',
    fontWeight: 'bold',
  },
  resendButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#73788B',
    borderRadius: 5,
    alignItems: 'center',
  },
  resendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.8,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#46345B',
    marginTop: 15,
    textAlign: 'center',
  },
  checkIconContainer: {
    marginVertical: 10,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 30,
    height: 15,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'white',
    transform: [{ rotate: '-45deg' }],
    marginTop: -5,
  },
  expiredIconContainer: {
    marginVertical: 10,
  },
  expiredCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expiredX: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  expiredText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E53935',
    marginTop: 15,
    textAlign: 'center',
  },
  expiredSubText: {
    fontSize: 14,
    color: '#73788B',
    marginTop: 5,
    textAlign: 'center',
  }
});

export default OtpVerification;