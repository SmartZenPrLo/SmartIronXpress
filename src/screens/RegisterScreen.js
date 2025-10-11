import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@react-native-vector-icons/feather';
import { useRoute } from '@react-navigation/native';
import { API_USER_REGISTER_URL, API_BRANCH_LIST } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ navigation }) {
  const route = useRoute();
  const { phoneNumber, latitude, longitude, address1, address2, pincode, fullAddress } = route.params || {};
  console.log("Data in Register Screen from Map---------------", phoneNumber, latitude, longitude, address1, address2, pincode, fullAddress);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  
  // City dropdown states
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    let timer;
    if (showSuccessModal) {
      timer = setTimeout(() => {
        setShowSuccessModal(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'LoginScreen' }],
        });
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showSuccessModal, navigation]);

  // Fetch cities/branches on component mount
  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setLoadingCities(true);
      const response = await fetch(API_BRANCH_LIST, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('lists data=========', data);
      
      if (response.ok) {
        // Map the API response to get BranchID and BranchName
        const cityList = data.map(branch => ({
          id: branch.BranchID || branch.branchId || branch.id,
          name: branch.BranchName || branch.branchName || branch.city || branch.name,
          // Add other properties you might need
        }));
        setCities(cityList);
      } else {
        console.error('Failed to fetch cities:', data.message);
        showError("Error", "Failed to load cities. Please try again.");
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      showError("Error", "Failed to load cities. Please check your connection.");
    } finally {
      setLoadingCities(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!selectedCity) {
      newErrors.city = 'Please select your city';
      isValid = false;
    }

    if (!latitude || !longitude || !address1) {
      newErrors.address = 'Address information is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const showError = (title, message, redirectToLogin = false) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShouldRedirectToLogin(redirectToLogin);
    setShowErrorModal(true);
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    if (shouldRedirectToLogin) {
      navigation.navigate('LoginScreen');
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setShowCityDropdown(false);
  };

  const handleRegister = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        const userData = {
           BranchID: selectedCity.id, 
          username: name,
          email,
          phoneNumber,
          password,
          address1: address1 || '',
          address2: address2 || '',
          pincode: pincode || '',
          fullAddress: fullAddress || '',
          latitude: latitude || '',
          longitude: longitude || '',
         
          isActive: true
        };
        console.log("User Data in the Register Screen-------------------", userData);
        
        const response = await fetch(`${API_USER_REGISTER_URL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        const data = await response.json();
        console.log("Data in Register Screen-----------------", data);
        
        if (response.ok) {
          const userId = data.userId;
          console.log("User ID in Register Screen-----------------", userId);
          if (userId) {
            await AsyncStorage.setItem('userId', userId.toString());
          }
          setShowSuccessModal(true);
        } else {
          console.error('Registration failed:', data.message);
          if (data.message && data.message.includes("already registered")) {
            showError(
              "User Already Exists",
              "This user is already registered. Please log in.",
              true
            );
          } else {
            showError(
              "Registration Failed", 
              data.message || "Something went wrong. Please try again."
            );
          }
        }
      } catch (error) {
        console.error('Registration error:', error);
        showError(
          "Error",
          "Failed to register. Please check your internet connection and try again."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started with Smart Iron Xpress</Text>
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Feather name="user" size={20} color="#73788B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#73788B"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Feather name="mail" size={20} color="#73788B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#73788B"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* City Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select City</Text>
                <TouchableOpacity 
                  style={styles.dropdownContainer}
                  onPress={() => setShowCityDropdown(!showCityDropdown)}
                >
                  <View style={styles.dropdownSelected}>
                    <Text style={selectedCity ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                      {selectedCity ? selectedCity.name : 'Select your city'}
                    </Text>
                    <Feather 
                      name={showCityDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#73788B" 
                    />
                  </View>
                </TouchableOpacity>
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

                {/* Dropdown List */}
                {showCityDropdown && (
                  <View style={styles.dropdownList}>
                    {loadingCities ? (
                      <View style={styles.dropdownLoading}>
                        <ActivityIndicator size="small" color="#46345B" />
                        <Text style={styles.dropdownLoadingText}>Loading cities...</Text>
                      </View>
                    ) : cities.length > 0 ? (
                      <ScrollView 
                        style={styles.dropdownScrollView}
                        nestedScrollEnabled={true}
                      >
                        {cities.map((city) => (
                          <TouchableOpacity
                            key={city.id}
                            style={[
                              styles.dropdownItem,
                              selectedCity && selectedCity.id === city.id && styles.dropdownItemSelected
                            ]}
                            onPress={() => handleCitySelect(city)}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              selectedCity && selectedCity.id === city.id && styles.dropdownItemTextSelected
                            ]}>
                              {city.name}
                            </Text>
                            {selectedCity && selectedCity.id === city.id && (
                              <Feather name="check" size={16} color="#F5761A" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : (
                      <View style={styles.dropdownEmpty}>
                        <Text style={styles.dropdownEmptyText}>No cities available</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={20} color="#73788B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor="#73788B"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#73788B" />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={20} color="#73788B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#73788B"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#73788B" />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address Information</Text>
                <View style={styles.addressContainer}>
                  {fullAddress ? (
                    <View style={styles.addressInfoContainer}>
                      <Text style={styles.addressText}>{fullAddress}</Text>
                      <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.changeAddressButton}
                      >
                        <Text style={styles.changeAddressText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.selectAddressButton} 
                      onPress={() => navigation.goBack()} 
                    >
                      <Feather name="map-pin" size={20} color="#fff" style={styles.mapIcon} />
                      <Text style={styles.selectAddressText}>Select Address on Map</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Feather name="check-circle" size={100} color="#4CAF50" style={styles.successIcon} />
            <Text style={styles.successTitle}>Registration Successful!</Text>
            <Text style={styles.successMessage}>
              Welcome to Smart Iron Xpress. Your account has been created successfully.
            </Text>
            <Text style={styles.redirectingText}>Redirecting you in a moment...</Text>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleErrorModalClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Feather name="alert-circle" size={80} color="#FF3B30" style={styles.errorIcon} />
            <Text style={styles.errorTitle}>{errorTitle}</Text>
            <Text style={styles.errorModalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={handleErrorModalClose}
            >
              <Text style={styles.errorButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#46345B',
    marginHorizontal: 24,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#73788B',
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 30,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#46345B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ADB2D4',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#000000',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  // Dropdown Styles
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ADB2D4',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  dropdownSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: '#46345B', // Changed to your theme color
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#73788B',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#ADB2D4',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#fff',
    maxHeight: 200,
    marginTop: -1,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  dropdownItemSelected: {
    backgroundColor: '#F5761A10', // Light orange background for selected item
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#46345B', // Your theme color for dropdown text
    fontWeight: '400',
  },
  dropdownItemTextSelected: {
    color: '#F5761A', // Orange color for selected text
    fontWeight: '600',
  },
  dropdownLoading: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dropdownLoadingText: {
    marginLeft: 10,
    color: '#73788B',
    fontSize: 14,
  },
  dropdownEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    color: '#73788B',
    fontSize: 14,
  },
  addressContainer: {
    marginTop: 8,
  },
  selectAddressButton: {
    backgroundColor: '#46345B',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIcon: {
    marginRight: 8,
  },
  selectAddressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  addressInfoContainer: {
    borderWidth: 1,
    borderColor: '#ADB2D4',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#46345B',
  },
  changeAddressButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F0F5',
    borderRadius: 8,
    marginLeft: 8,
  },
  changeAddressText: {
    color: '#46345B',
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#F5761A',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  registerButtonDisabled: {
    backgroundColor: '#F5761A80',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  loginPromptText: {
    color: '#73788B',
    fontSize: 16,
  },
  loginLink: {
    color: '#46345B',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
  },
  successIcon: {
    marginBottom: 20,
  },
  errorIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 15,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 15,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#73788B',
    marginBottom: 25,
    textAlign: 'center',
  },
  errorModalMessage: {
    fontSize: 16,
    color: '#73788B',
    marginBottom: 25,
    textAlign: 'center',
  },
  redirectingText: {
    fontSize: 14,
    color: '#73788B',
    fontStyle: 'italic',
  },
  errorButton: {
    backgroundColor: '#46345B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});