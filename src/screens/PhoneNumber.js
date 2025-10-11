import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import { CountryPicker } from 'react-native-country-codes-picker'; 
import {API_OTP_URL} from '../api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PhoneNumberVerification = () => {
  const navigation = useNavigation(); 
  const route = useRoute();
  const { from } = route.params;
  console.log("From in Phone Number------------------------",from);
  const [phoneNumber, setPhoneNumber] = useState(route.params?.phoneNumber || '');
  console.log("Phone number in the phone number screen------------------", phoneNumber);
  const userId = route.params?.userId || null;
  console.log("Company ID-----------------from login================",userId);
  const [countryCode, setCountryCode] = useState(null); 
  const [countryFlag, setCountryFlag] = useState(null); 
  const app = "customer";
  console.log("App in Phone number screen------------------", app);
  console.log(typeof app);
  const [error, setError] = useState('');
  const [countryError, setCountryError] = useState(''); 
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  
  const validateInputs = () => {
    let isValid = true;
    if (!countryCode) {
      setCountryError('Please select country code');
      isValid = false;
    } else {
      setCountryError('');
    }
    
    if (!phoneNumber) {
      setError('Phone number is required');
      isValid = false;
    } else {
      setError('');
    }
    return isValid;
  };
  
  const handleContinue = async () => {
    if (validateInputs()) {
      setIsLoading(true);
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      console.log('Full Phone number Sending OTP to:========', fullPhoneNumber);
  
      try {
        const response = await fetch(`${API_OTP_URL}?phoneNumber=${fullPhoneNumber}&app=${app}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        const data = await response.json();
        console.log("Data in the OTP send:==============", data);
  
        if (response.ok) {
          console.log('OTP sent successfully:', data, phoneNumber);
          navigation.navigate('OtpVerification', { 
            phoneNumber: fullPhoneNumber, 
            from, 
            userId 
          });
        } else {
          console.log('Failed to send OTP:', data);
          setError(data.message || 'Failed to send OTP');
        }
      } catch (error) {
        console.error('Error sending OTP:', error);
        setError(`Network error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };   

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        backgroundColor="#46345B" 
        barStyle="light-content" 
      />
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Icon 
            name="shield-checkmark-outline" 
            color="#73788B" 
            size={60} 
            style={styles.shieldIcon}
          />
          <Text style={styles.titleText}>Verify Your Phone</Text>
          <Text style={styles.subtitleText}>
            Enter your whatsapp number to receive a verification code
          </Text>
        </View>
        
        <View style={styles.inputSection}>
          {/* Country Code Selection - Top */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Country</Text>
            <TouchableOpacity 
              style={[
                styles.countryCodeContainer,
                countryError ? styles.inputError : null
              ]}
              onPress={() => setShow(true)}
              disabled={isLoading}
            >
              <Text style={[
                styles.countryCodeText,
                !countryCode && styles.placeholderText
              ]}>
                {countryFlag ? `${countryFlag} ${countryCode}` : 'Choose your country'}
              </Text>
              <Icon 
                name="chevron-down" 
                color="#46345B" 
                size={20} 
              />
            </TouchableOpacity>
            {countryError ? (
              <Text style={styles.errorText}>{countryError}</Text>
            ) : null}
          </View>

          {/* Phone Number Input - Bottom */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Enter mobile number</Text>
            <View style={[
              styles.inputWrapper,
              error ? styles.inputError : null
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
                autoCapitalize='characters'
                maxLength={10}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setError('');
                }}
                editable={!isLoading}
              />
            </View>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={styles.helperText}>
                We'll send a 6-digit verification code
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.continueButton,
            isLoading ? styles.continueButtonDisabled : null
          ]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Icon 
                name="arrow-forward" 
                color="white" 
                size={20} 
                style={styles.buttonIcon}
              />
            </>
          )}
        </TouchableOpacity>
        {/* <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            By tapping Continue, you agree to our 
            <Text style={styles.linkText}> Terms </Text> 
            and 
            <Text style={styles.linkText}> Privacy Policy</Text>
          </Text>
        </View> */}
      </View>
      <CountryPicker
        show={show}
        pickerButtonOnPress={(item) => {
          setCountryCode(item.dial_code);
          setCountryFlag(item.flag);
          setCountryError(''); 
          setShow(false);
        }}
         onBackdropPress={() => setShow(false)}
        style={{
          modal: {
            height: 500,
          },
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  shieldIcon: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#46345B',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 16,
    color: '#73788B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 30,
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  countryCodeText: {
    fontSize: 14,
    color: '#46345B',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#73788B',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  phoneIcon: {
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: '#46345B',
    paddingVertical: 15,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginTop: 8,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#73788B',
    marginTop: 8,
    marginLeft: 4,
  },
  continueButton: {
    backgroundColor: '#F5761A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 18,
    marginBottom: 20,
    shadowColor: '#46345B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: '#A8A8A8',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  disclaimerContainer: {
    paddingHorizontal: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#73788B',
    textAlign: 'center',
    lineHeight: 16,
  },
  linkText: {
    color: '#46345B',
    fontWeight: '500',
  },
});

export default PhoneNumberVerification;