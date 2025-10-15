import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import Icon from '@react-native-vector-icons/material-icons';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useNavigation, useRoute } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_USER_ADDRESS } from '../api';
const { width, height } = Dimensions.get('window');

Geocoder.init("AIzaSyB0sMzzE-VfCGCX71_So97P3oRYmRFJvKE");

const AddressEditScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mapRef = useRef(null);
  const confettiRef = useRef(null);

  // Get existing address data from params
  const { existingAddress, Latitude, Longitude, userId } = route.params || {};
  console.log('Address, userid ,Latitude,Longitude-=-=-=-=-=-=-=-=', existingAddress, Latitude, Longitude, userId);

  // State management
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markerPosition, setMarkerPosition] = useState(null);
  const [fullAddress, setFullAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showConfettiModal, setShowConfettiModal] = useState(false);
  const [confirmedLocationData, setConfirmedLocationData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Store the edited address separately
  const [editedAddress, setEditedAddress] = useState('');

  // Debug state changes
  useEffect(() => {
    console.log('🔍 Address State Update:', {
      fullAddress,
      markerPosition,
      isEditing,
      saving,
      existingAddress: existingAddress,
      editedAddress: editedAddress
    });
  }, [fullAddress, markerPosition, isEditing, saving, editedAddress]);

  // Load existing address if provided - UPDATED VERSION
  useEffect(() => {
    const initializeAddress = async () => {
      try {
        console.log('🔄 Initializing address with:', { existingAddress, Latitude, Longitude, userId });
        
        if (existingAddress) {
          console.log('📝 Setting up existing address:', existingAddress);
          setIsEditing(true);
          setFullAddress(existingAddress);
          setEditedAddress(existingAddress); // Initialize edited address
          
          // Use Latitude and Longitude from params to pin the map
          if (Latitude && Longitude) {
            const coordinate = {
              latitude: parseFloat(Latitude),
              longitude: parseFloat(Longitude)
            };
            setMarkerPosition(coordinate);
            setRegion({
              ...coordinate,
              latitudeDelta: 0.015,
              longitudeDelta: 0.0121,
            });
            console.log('📍 Marker set from Latitude/Longitude params:', coordinate);
            setLoading(false);
          } else {
            // If no coordinates but have address, geocode it
            console.log('📍 No coordinates, geocoding address:', existingAddress);
            await geocodeAddress(existingAddress);
          }
        } else {
          // No existing address, get current location
          console.log('📍 No existing address, getting current location');
          await getLocation();
        }
      } catch (error) {
        console.error('❌ Error initializing address:', error);
        await getLocation();
      }
    };

    initializeAddress();
  }, [existingAddress, Latitude, Longitude]);

  // Geocode address string to coordinates
  const geocodeAddress = async (address) => {
    try {
      setLoading(true);
      console.log('🗺️ Geocoding address:', address);
      const response = await Geocoder.from(address);
      if (response.results.length > 0) {
        const { lat, lng } = response.results[0].geometry.location;
        const coordinate = { latitude: lat, longitude: lng };
        const formattedAddress = response.results[0].formatted_address;
        
        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        };
        
        // Update both coordinates AND address
        setRegion(newRegion);
        setMarkerPosition(coordinate);
        setFullAddress(formattedAddress);
        setEditedAddress(formattedAddress); // Also update edited address
        
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
        console.log('✅ Geocoding successful:', { coordinate, formattedAddress });
      }
    } catch (error) {
      console.log('❌ Error geocoding address:', error);
      Alert.alert('Error', 'Could not find this address on map');
    } finally {
      setLoading(false);
    }
  };

  // Location permission and fetching
  const requestLocationPermission = async () => {
    try {
      let permission = Platform.OS === 'android' 
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION 
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      
      const status = await check(permission);
      
      if (status === RESULTS.GRANTED) return true;
      
      const requestResult = await request(permission);
      return requestResult === RESULTS.GRANTED;
    } catch (err) {
      console.error("Permission error:", err);
      return false;
    }
  };

  const getLocation = async () => {
    try {
      setLoading(true);
      
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLoading(false);
        Alert.alert("Location Permission Required", "Please enable location permissions in your device settings to use this feature.");
        return;
      }

      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          resolve,
          reject,
          { 
            enableHighAccuracy: true, 
            timeout: 15000, 
            maximumAge: 10000 
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      };
      
      setRegion(newRegion);
      setMarkerPosition({ latitude, longitude });
      await getAddressFromCoordinates({ latitude, longitude });
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
      console.log('📍 Current location set:', { latitude, longitude });
    } catch (error) {
      console.error("Location Error:", error);
      Alert.alert("Location Error", "Unable to get your current location. Please check your GPS and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get address from coordinates
  const getAddressFromCoordinates = async (coordinate) => {
    try {
      setLoading(true);
      
      const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=AIzaSyB0sMzzE-VfCGCX71_So97P3oRYmRFJvKE`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();

      console.log('🗺️ Geocoding API Response:', data.status);

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        const address = result.formatted_address;
        setFullAddress(address);
        setEditedAddress(address); // Also update edited address
        console.log('✅ Address found from coordinates:', address);
      } else {
        console.log('❌ Geocoding failed:', data.status);
        const errorMessage = "No address found for this location";
        setFullAddress(errorMessage);
        setEditedAddress(errorMessage);
      }
    } catch (error) {
      console.error("Address fetch failed:", error);
      const errorMessage = "Network error - check your connection";
      setFullAddress(errorMessage);
      setEditedAddress(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Map interactions
  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    
    // Update coordinates immediately
    setMarkerPosition(coordinate);
    
    const newRegion = {
      ...coordinate,
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    };

    setRegion(newRegion);
    
    // Get address for the new coordinates
    getAddressFromCoordinates(coordinate);
    
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 500);
    }
    console.log('🗺️ Map pressed, new marker:', coordinate);
  };

  const resetToCurrentLocation = () => {
    console.log('📍 Resetting to current location');
    getLocation();
  };

  // Search location function
  const searchLocation = async () => {
    if (!searchText.trim()) {
      Alert.alert('Search Error', 'Please enter a location to search');
      return;
    }
    
    try {
      setSearchLoading(true);
      console.log('🔍 Searching for:', searchText);
      const response = await Geocoder.from(searchText);
      if (response.results.length === 0) {
        Alert.alert('No Results', 'No locations found for your search. Please try different keywords.');
        return;
      }

      const { lat, lng } = response.results[0].geometry.location;
      const coordinate = { latitude: lat, longitude: lng };
      const formattedAddress = response.results[0].formatted_address;
      
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      };
      
      // Update both coordinates and address
      setRegion(newRegion);
      setMarkerPosition(coordinate);
      setFullAddress(formattedAddress);
      setEditedAddress(formattedAddress); // Also update edited address
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
      console.log('✅ Search result:', { coordinate, formattedAddress });
    } catch (error) {
      console.log('❌ Error searching location:', error);
      Alert.alert('Search Error', 'Failed to search location. Please check your connection and try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Save address to API
  const saveAddressToAPI = async (addressData) => {
    try {
      console.log('💾 Saving address to API:', addressData);
      
      const response = await fetch(`${API_USER_ADDRESS}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          FullAddress: addressData.fullAddress,
          Latitude: addressData.latitude.toString(),
          Longitude: addressData.longitude.toString()
        }),
      });

      console.log("📡 API Response status:", response.status);
      
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Non-JSON response:', {
          status: response.status,
          text: textResponse
        });
        
        if (response.status === 500) {
          throw new Error('Server error: Please try again later');
        }
        
        throw new Error(`Server returned ${response.status}. Expected JSON but got ${contentType}`);
      }

      const result = await response.json();
      console.log("✅ API Response result:", result);

      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to update address');
      }

      return result;
      
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  };

  // Address confirmation - UPDATED to use editedAddress
  const confirmLocation = async () => {
    if (!markerPosition) {
      Alert.alert('Selection Required', 'Please select a location on the map first by tapping on your desired location.');
      return;
    }

    const addressToSave = editedAddress.trim() || fullAddress.trim();
    
    if (!addressToSave) {
      Alert.alert('Address Required', 'Please select a valid address. Tap on the map or use search to find your location.');
      return;
    }

    setSaving(true);

    const addressData = {
      latitude: markerPosition.latitude,
      longitude: markerPosition.longitude,
      fullAddress: addressToSave,
      lastUpdated: new Date().toISOString()
    };

    try {
      console.log('💾 Starting save process:', addressData);
      
      // Save to API only
      let apiSuccess = false;
      if (userId) {
        try {
          await saveAddressToAPI(addressData);
          apiSuccess = true;
          console.log('✅ API save successful');
        } catch (apiError) {
          console.warn('⚠️ API save failed:', apiError);
          Alert.alert(
            'API Save Warning', 
            'Address was not saved to server, but you can continue using the app. Please try again later.',
            [{ text: 'OK' }]
          );
        }
      }
      
      // Update state with new data
      setConfirmedLocationData(addressData);
      
      setShowConfettiModal(true);
      if (confettiRef.current) {
        confettiRef.current.start();
      }
      
      console.log('🎉 Address saved successfully:', addressData);
      
    } catch (error) {
      console.error('❌ Save error:', error);
      Alert.alert('Save Error', error.message || 'Failed to save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfettiComplete = () => {
    if (confirmedLocationData) {
      // Pass the updated data back to previous screen
      navigation.navigate({
        name: 'BottomTabNavigator', 
        params: { 
          refreshedAddress: confirmedLocationData,
          refreshTime: Date.now(),
          forceRefresh: true
        },
        merge: true
      });
      setShowConfettiModal(false);
    }
  };

  // Handle saving address form - UPDATED to properly store edited address
  const handleSaveAddressForm = () => {
    if (editedAddress.trim()) {
      // Update both fullAddress and editedAddress when saving from modal
      setFullAddress(editedAddress);
      setShowAddressForm(false);
      console.log('✅ Address updated in state:', editedAddress);
    } else {
      Alert.alert('Address Required', 'Please enter a valid address.');
    }
  };

  // Handle address input change in modal - UPDATED to use editedAddress
  const handleAddressChange = (text) => {
    setEditedAddress(text);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      > */}
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Address' : 'Add Address'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF7518" />
            <Text style={styles.loadingText}>
              {existingAddress ? 'Loading your address...' : 'Getting your location...'}
            </Text>
          </View>
        ) : (
          <View style={styles.content}>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for area, landmark, or address..."
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={searchLocation}
                  returnKeyType="search"
                  placeholderTextColor="#999"
                />
              </View>
              <TouchableOpacity 
                style={styles.searchButton} 
                onPress={searchLocation}
                disabled={searchLoading}
              >
                {searchLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="search" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={region}
                onPress={handleMapPress}
                showsUserLocation={true}
                showsMyLocationButton={false}
              >
                {markerPosition && (
                  <Marker
                    coordinate={markerPosition}
                    title="Selected Location"
                    description={fullAddress}
                  >
                    <View style={styles.customMarker}>
                      <Icon name="location-pin" size={40} color="#FF7518" />
                    </View>
                  </Marker>
                )}
              </MapView>

              <TouchableOpacity 
                style={styles.myLocationButton}
                onPress={resetToCurrentLocation}
              >
                <Icon name="gps-fixed" size={22} color="#FF7518" />
              </TouchableOpacity>
            </View>

            {/* Selected Address Preview */}
            <View style={styles.addressCard}>
              <View style={styles.locationPreview}>
                <View style={styles.locationHeader}>
                  <Icon name="place" size={24} color="#FF7518" />
                  <Text style={styles.locationTitle}>
                    {isEditing ? 'Your Current Address' : 'Selected Location'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.singleAddressOption} 
                    onPress={() => setShowAddressForm(true)}
                    activeOpacity={0.7}
                  >
                    <Icon name="edit" size={24} color="#999" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.locationText} numberOfLines={3}>
                  {fullAddress || 'Tap on map to select location'}
                </Text>
                {markerPosition && (
                  <Text style={styles.coordinates}>
                    Lat: {markerPosition.latitude.toFixed(6)}, Lng: {markerPosition.longitude.toFixed(6)}
                  </Text>
                )}
              </View>

              {/* Confirm Button */}
              <TouchableOpacity 
                style={[
                  styles.confirmButton, 
                  (!markerPosition || (!fullAddress.trim() && !editedAddress.trim()) || saving) && styles.confirmButtonDisabled
                ]} 
                onPress={confirmLocation}
                disabled={!markerPosition || (!fullAddress.trim() && !editedAddress.trim()) || saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="check-circle" size={20} color="#fff" />
                )}
                <Text style={styles.confirmButtonText}>
                  {saving ? 'Saving...' : (isEditing ? 'Update Address' : 'Save Address')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Address Form Modal - UPDATED to use editedAddress */}
        <Modal
          visible={showAddressForm}
          animationType="fade"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddressForm(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Address' : 'Enter Address'}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowAddressForm(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Address *</Text>
                <TextInput
                  style={[styles.textInput, styles.fullAddressInput]}
                  placeholder="Enter your complete address including street, city, state, and PIN code"
                  value={editedAddress}
                  onChangeText={handleAddressChange}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={styles.inputHint}>
                  Make sure your address is complete and accurate for delivery
                </Text>
              </View>

              <View style={styles.modalLocationPreview}>
                <Text style={styles.modalLocationTitle}>Current Map Location</Text>
                <Text style={styles.modalLocationText}>
                  {editedAddress || 'No location selected on map'}
                </Text>
                {markerPosition && (
                  <Text style={styles.coordinates}>
                    Lat: {markerPosition.latitude.toFixed(6)}, Lng: {markerPosition.longitude.toFixed(6)}
                  </Text>
                )}
                <Text style={styles.inputHint}>
                  Note: Only the address text will be updated. Map coordinates remain the same.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddressForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, !editedAddress.trim() && styles.saveButtonDisabled]}
                onPress={handleSaveAddressForm}
                disabled={!editedAddress.trim()}
              >
                <Text style={styles.saveButtonText}>Update Address</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showConfettiModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleConfettiComplete}
        >
          <View style={styles.confettiModal}>
            <View style={styles.confettiContent}>
              <Icon name="check-circle" size={60} color="#4CAF50" />
              <Text style={styles.confettiTitle}>
                {isEditing ? 'Address Updated!' : 'Address Saved!'}
              </Text>
              <Text style={styles.confettiMessage}>
                {isEditing 
                  ? 'Your address has been updated successfully.' 
                  : 'Your delivery address has been saved successfully.'
                }
              </Text>
              <View style={styles.savedAddressPreview}>
                <Text style={styles.savedAddressTitle}>Saved Address:</Text>
                <Text style={styles.savedAddressText}>{editedAddress || fullAddress}</Text>
                {markerPosition && (
                  <Text style={styles.coordinates}>
                    Coordinates: {markerPosition.latitude.toFixed(6)}, {markerPosition.longitude.toFixed(6)}
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={handleConfettiComplete}
              >
                <Text style={styles.continueButtonText}>Continue to Profile</Text>
              </TouchableOpacity>
            </View>
            <ConfettiCannon
              ref={confettiRef}
              count={200}
              origin={{x: -10, y: 0}}
              autoStart={false}
            />
          </View>
        </Modal>
      {/* </KeyboardAvoidingView> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerPlaceholder: {
    width: 32,
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
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  searchIcon: {
    padding: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#FF7518',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  myLocationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  locationPreview: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  singleAddressOption: {
    padding: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  coordinates: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#FF7518',
    padding: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  fullAddressInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  modalLocationPreview: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  modalLocationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalLocationText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  useCurrentLocationButton: {
    backgroundColor: '#FF7518',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  useCurrentLocationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FF7518',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confettiModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  confettiTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  confettiMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  savedAddressPreview: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  savedAddressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  savedAddressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#FF7518',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddressEditScreen;






// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   StyleSheet, 
//   Text, 
//   View, 
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   Platform,
//   TextInput,
//   Modal,
//   ScrollView,
//   KeyboardAvoidingView
// } from 'react-native';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// import Geolocation from '@react-native-community/geolocation';
// import Geocoder from 'react-native-geocoding';
// import Icon from '@react-native-vector-icons/material-icons';
// import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import ConfettiCannon from 'react-native-confetti-cannon';
// import { SafeAreaView } from 'react-native-safe-area-context';

// Geocoder.init("AIzaSyB0sMzzE-VfCGCX71_So97P3oRYmRFJvKE");

// const AddressEditScreen = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const mapRef = useRef(null);
//   const confettiRef = useRef(null);

//   // State management
//   const [region, setRegion] = useState({
//     latitude: 37.78825,
//     longitude: -122.4324,
//     latitudeDelta: 0.0922,
//     longitudeDelta: 0.0421,
//   });
//   const [markerPosition, setMarkerPosition] = useState(null);
//   const [address, setAddress] = useState('');
//   const [addressName, setAddressName] = useState('');
//   const [addressLine1, setAddressLine1] = useState('');
//   const [addressLine2, setAddressLine2] = useState('');
//   const [pincode, setPincode] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [searchText, setSearchText] = useState('');
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [location, setLocation] = useState(null);
//   const [isUserSelected, setIsUserSelected] = useState(false);
//   const [error, setError] = useState(null);
//   const [showAddressForm, setShowAddressForm] = useState(false);
//   const [showConfettiModal, setShowConfettiModal] = useState(false);
//   const [confirmedLocationData, setConfirmedLocationData] = useState(null);
//   const [showErrorModal, setShowErrorModal] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');

//   // const { phoneNumber } = route.params;

//   // Location permission and fetching
//   const requestLocationPermission = async () => {
//     try {
//       let permission = Platform.OS === 'android' 
//         ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION 
//         : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      
//       const status = await check(permission);
      
//       if (status === RESULTS.GRANTED) return true;
      
//       const requestResult = await request(permission);
//       return requestResult === RESULTS.GRANTED;
//     } catch (err) {
//       console.error("Permission error:", err);
//       return false;
//     }
//   };

//   const getLocation = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const hasPermission = await requestLocationPermission();
//       if (!hasPermission) {
//         setLoading(false);
//         setErrorMessage("Please enable location permissions in your device settings.");
//         setShowErrorModal(true);
//         return;
//       }

//       const position = await new Promise((resolve, reject) => {
//         Geolocation.getCurrentPosition(
//           resolve,
//           reject,
//           { 
//             enableHighAccuracy: true, 
//             timeout: 15000, 
//             maximumAge: 10000 
//           }
//         );
//       });

//       const { latitude, longitude } = position.coords;
//       const newRegion = {
//         latitude,
//         longitude,
//         latitudeDelta: 0.015,
//         longitudeDelta: 0.0121,
//       };
      
//       setRegion(newRegion);
//       setMarkerPosition({ latitude, longitude });
//       setLocation(position.coords);
//       getAddressFromCoordinates({ latitude, longitude });
      
//       mapRef.current?.animateToRegion(newRegion, 500);
//     } catch (error) {
//       console.error("Location Error:", error);
//       setErrorMessage("Unable to get your current location");
//       setShowErrorModal(true);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Address handling
//   const getAddressFromCoordinates = async (coordinate) => {
//     try {
//       setLoading(true);
//       const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=AIzaSyA2A_NRpPFj8JjL5kWIY8ItNJXJoRC95wE`;
      
//       const response = await fetch(apiUrl);
//       const data = await response.json();

//       if (data.status === "OK" && data.results.length > 0) {
//         const result = data.results[0];
//         const fullAddress = result.formatted_address;
        
//         let streetAddress = "";
//         let area = "";
//         let pincode = "";

//         result.address_components.forEach(comp => {
//           if (comp.types.includes("street_number") || comp.types.includes("route")) {
//             streetAddress = streetAddress ? `${streetAddress} ${comp.long_name}` : comp.long_name;
//           }
//           if (comp.types.includes("sublocality") || comp.types.includes("locality")) {
//             area = comp.long_name;
//           }
//           if (comp.types.includes("postal_code")) {
//             pincode = comp.long_name;
//           }
//         });

//         setAddress(fullAddress);
//         setAddressLine1(streetAddress || fullAddress.split(',')[0]);
//         setAddressLine2(area);
//         setPincode(pincode);
//       }
//     } catch (error) {
//       console.error("Address fetch failed:", error);
//       setAddress("Couldn't retrieve address details");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Map interactions
//   const handleMapPress = (event) => {
//     const { coordinate } = event.nativeEvent;
//     setIsUserSelected(true);
//     setMarkerPosition(coordinate);
//     getAddressFromCoordinates(coordinate);

//     const newRegion = {
//       ...coordinate,
//       latitudeDelta: 0.015,
//       longitudeDelta: 0.0121,
//     };

//     setRegion(newRegion);
//     mapRef.current?.animateToRegion(newRegion, 500);
//   };

//   const resetToCurrentLocation = () => {
//     setIsUserSelected(false);
//     getLocation();
//   };

//   const searchLocation = async () => {
//     if (!searchText.trim()) {
//       // Alert.alert('Error', 'Please enter a location to search');
//       return;
//     }
    
//     try {
//       setSearchLoading(true);
//       const response = await Geocoder.from(searchText);
//       if (response.results.length === 0) {
//         Alert.alert('Not Found', 'No locations found for your search');
//         return;
//       }

//       const { lat, lng } = response.results[0].geometry.location;
//       const coordinate = { latitude: lat, longitude: lng };
      
//       const newRegion = {
//         latitude: lat,
//         longitude: lng,
//         latitudeDelta: 0.015,
//         longitudeDelta: 0.0121,
//       };
      
//       setRegion(newRegion);
//       setMarkerPosition(coordinate);
//       setAddress(response.results[0].formatted_address);
//       setIsUserSelected(true);
//       mapRef.current?.animateToRegion(newRegion, 500);
//     } catch (error) {
//       console.log('Error searching location:', error);
//       Alert.alert('Error', 'Failed to search location');
//     } finally {
//       setSearchLoading(false);
//     }
//   };

//   // Address confirmation
//   const confirmLocation = () => {
//     if (!markerPosition) {
//       Alert.alert('Error', 'Please select a location on the map first');
//       return;
//     }

//     if (!addressLine1.trim()) {
//       Alert.alert('Error', 'Please enter address line 1');
//       return;
//     }

//     const locationData = {
//       latitude: markerPosition.latitude,
//       longitude: markerPosition.longitude,
//       addressLine1,
//       addressLine2,
//       pincode,
//       addressName: addressName || 'My Address',
//       fullAddress: `${addressName ? addressName + '\n' : ''}${addressLine1}${addressLine2 ? '\n' + addressLine2 : ''}${pincode ? '\nPIN: ' + pincode : ''}`
//     };

//     setConfirmedLocationData(locationData);
//     setShowConfettiModal(true);
//     if (confettiRef.current) {
//       confettiRef.current.start();
//     }
//   };

//   const handleConfettiComplete = () => {
//     if (confirmedLocationData) {
//       navigation.navigate('RegisterScreen', confirmedLocationData);
//       setShowConfettiModal(false);
//     }
//   };

//   // Render address option item (similar to your profile option)
//   const renderAddressOption = (iconName, title, value, onPress, color = '#FF7518') => (
//     <TouchableOpacity style={styles.addressOption} onPress={onPress}>
//       <View style={[styles.optionIconContainer, { backgroundColor: `${color}15` }]}>
//         <Icon name={iconName} size={22} color={color} />
//       </View>
//       <View style={styles.optionTextContainer}>
//         <Text style={styles.optionTitle}>{title}</Text>
//         {value ? (
//           <Text style={styles.optionSubtitle} numberOfLines={2}>{value}</Text>
//         ) : (
//           <Text style={styles.optionPlaceholder}>Tap to add {title.toLowerCase()}</Text>
//         )}
//       </View>
//       <Icon name="chevron-right" size={20} color="#999" />
//     </TouchableOpacity>
//   );

//   // Effects
//   useEffect(() => {
//     getLocation();
//   }, []);

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView 
//         style={styles.container} 
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       >
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity 
//             style={styles.backButton}
//             onPress={() => navigation.goBack()}
//           >
//             <Icon name="arrow-back" size={24} color="#333" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Edit Address</Text>
//           <View style={styles.headerPlaceholder} />
//         </View>

//         {loading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#FF7518" />
//             <Text style={styles.loadingText}>Getting your location...</Text>
//           </View>
//         ) : (
//           <View style={styles.content}>
//             {/* Search Bar */}
//             <View style={styles.searchContainer}>
//               <View style={styles.searchInputContainer}>
//                 <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
//                 <TextInput
//                   style={styles.searchInput}
//                   placeholder="Search for area, landmark..."
//                   value={searchText}
//                   onChangeText={setSearchText}
//                   onSubmitEditing={searchLocation}
//                   returnKeyType="search"
//                 />
//               </View>
//               <TouchableOpacity 
//                 style={styles.searchButton} 
//                 onPress={searchLocation}
//                 disabled={searchLoading}
//               >
//                 {searchLoading ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <Icon name="my-location" size={18} color="#fff" />
//                 )}
//               </TouchableOpacity>
//             </View>

//             {/* Map */}
//             <View style={styles.mapContainer}>
//               <MapView
//                 ref={mapRef}
//                 provider={PROVIDER_GOOGLE}
//                 style={styles.map}
//                 region={region}
//                 onPress={handleMapPress}
//               >
//                 {markerPosition && (
//                   <Marker coordinate={markerPosition}>
//                     <View style={styles.customMarker}>
//                       <Icon name="location-pin" size={40} color="#FF7518" />
//                     </View>
//                   </Marker>
//                 )}
//               </MapView>

//               <TouchableOpacity 
//                 style={styles.myLocationButton}
//                 onPress={resetToCurrentLocation}
//               >
//                 <Icon name="gps-fixed" size={24} color="#FF7518" />
//               </TouchableOpacity>
//             </View>

//             {/* Address Details Card */}
//             <View style={styles.addressCard}>
//               {/* <Text style={styles.cardTitle}>Address Details</Text> */}
              
//               {renderAddressOption(
//                 'home',
//                 'Address Name',
//                 addressName,
//                 () => setShowAddressForm(true)
//               )}
//               {/* Selected Location Preview */}
//               <View style={styles.locationPreview}>
//                 <View style={styles.locationHeader}>
//                   <Icon name="place" size={18} color="#FF7518" />
//                   <Text style={styles.locationTitle}>Selected Location</Text>
//                 </View>
//                 <Text style={styles.locationText} numberOfLines={2}>
//                   {address || 'Tap on map to select location'}
//                 </Text>
//                 {markerPosition && (
//                   <Text style={styles.coordinates}>
//                     {markerPosition.latitude.toFixed(6)}, {markerPosition.longitude.toFixed(6)}
//                   </Text>
//                 )}
//               </View>

//               {/* Confirm Button */}
//               <TouchableOpacity 
//                 style={[
//                   styles.confirmButton, 
//                   !markerPosition && styles.confirmButtonDisabled
//                 ]} 
//                 onPress={confirmLocation}
//                 disabled={!markerPosition}
//               >
//                 <Icon name="check-circle" size={20} color="#fff" />
//                 <Text style={styles.confirmButtonText}>Confirm Address</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}

//         {/* Address Form Modal */}
//         <Modal
//           visible={showAddressForm}
//           animationType="slide"
//           presentationStyle="pageSheet"
//         >
//           <SafeAreaView style={styles.modalContainer}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Edit Address</Text>
//               <TouchableOpacity 
//                 onPress={() => setShowAddressForm(false)}
//                 style={styles.closeButton}
//               >
//                 <Icon name="close" size={24} color="#333" />
//               </TouchableOpacity>
//             </View>

//             <ScrollView style={styles.formContainer}>
//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>Address Name</Text>
//                 <TextInput
//                   style={styles.textInput}
//                   placeholder="Home, Office, etc."
//                   value={addressName}
//                   onChangeText={setAddressName}
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>Address Line 1 *</Text>
//                 <TextInput
//                   style={styles.textInput}
//                   placeholder="House/Flat No., Building, Street"
//                   value={addressLine1}
//                   onChangeText={setAddressLine1}
//                   multiline
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>Address Line 2</Text>
//                 <TextInput
//                   style={styles.textInput}
//                   placeholder="Area, Landmark, Sector"
//                   value={addressLine2}
//                   onChangeText={setAddressLine2}
//                   multiline
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>PIN Code</Text>
//                 <TextInput
//                   style={styles.textInput}
//                   placeholder="6-digit PIN Code"
//                   value={pincode}
//                   onChangeText={setPincode}
//                   keyboardType="number-pad"
//                   maxLength={6}
//                 />
//               </View>
//             </ScrollView>

//             <View style={styles.modalActions}>
//               <TouchableOpacity 
//                 style={styles.cancelButton}
//                 onPress={() => setShowAddressForm(false)}
//               >
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity 
//                 style={styles.saveButton}
//                 onPress={() => setShowAddressForm(false)}
//               >
//                 <Text style={styles.saveButtonText}>Save Changes</Text>
//               </TouchableOpacity>
//             </View>
//           </SafeAreaView>
//         </Modal>

//         {/* Success Modal */}
//         <Modal
//           visible={showConfettiModal}
//           transparent={true}
//           animationType="fade"
//         >
//           <View style={styles.confettiModal}>
//             <View style={styles.confettiContent}>
//               <Icon name="check-circle" size={60} color="#4CAF50" />
//               <Text style={styles.confettiTitle}>Address Saved!</Text>
//               <Text style={styles.confettiMessage}>
//                 Your location has been confirmed successfully
//               </Text>
//               <TouchableOpacity 
//                 style={styles.continueButton}
//                 onPress={handleConfettiComplete}
//               >
//                 <Text style={styles.continueButtonText}>Continue</Text>
//               </TouchableOpacity>
//             </View>
//             <ConfettiCannon
//               ref={confettiRef}
//               count={200}
//               origin={{x: -10, y: 0}}
//               autoStart={false}
//             />
//           </View>
//         </Modal>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   backButton: {
//     padding: 4,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//   },
//   headerPlaceholder: {
//     width: 32,
//   },
//   content: {
//     flex: 1,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     padding: 16,
//     gap: 12,
//   },
//   searchInputContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8f8f8',
//     borderRadius: 12,
//     paddingHorizontal: 12,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//   },
//   searchButton: {
//     backgroundColor: '#FF7518',
//     width: 50,
//     height: 50,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   mapContainer: {
//     flex: 1,
//     position: 'relative',
//   },
//   map: {
//     flex: 1,
//   },
//   myLocationButton: {
//     position: 'absolute',
//     top: 16,
//     right: 16,
//     backgroundColor: '#fff',
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   addressCard: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   cardTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     // marginBottom: 16,
//     color: '#333',
//   },
//   // Address Option Styles (matching your profile design)
//   addressOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   optionIconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   optionTextContainer: {
//     flex: 1,
//   },
//   optionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 2,
//   },
//   optionSubtitle: {
//     fontSize: 14,
//     color: '#666',
//   },
//   optionPlaceholder: {
//     fontSize: 14,
//     color: '#999',
//     fontStyle: 'italic',
//   },
//   locationPreview: {
//     backgroundColor: '#f8f9fa',
//     padding: 16,
//     borderRadius: 12,
//     marginTop: 16,
//     marginBottom: 20,
//   },
//   locationHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   locationTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginLeft: 8,
//   },
//   locationText: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
//   coordinates: {
//     fontSize: 12,
//     color: '#999',
//     marginTop: 4,
//   },
//   confirmButton: {
//     backgroundColor: '#FF7518',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     borderRadius: 12,
//     gap: 8,
//   },
//   confirmButtonDisabled: {
//     backgroundColor: '#ccc',
//   },
//   confirmButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   // Modal Styles
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//   },
//   closeButton: {
//     padding: 4,
//   },
//   formContainer: {
//     flex: 1,
//     padding: 16,
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   inputLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 8,
//   },
//   textInput: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 16,
//     backgroundColor: '#fafafa',
//   },
//   modalActions: {
//     flexDirection: 'row',
//     padding: 16,
//     gap: 12,
//   },
//   cancelButton: {
//     flex: 1,
//     padding: 16,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     color: '#666',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   saveButton: {
//     flex: 1,
//     padding: 16,
//     borderRadius: 8,
//     backgroundColor: '#FF7518',
//     alignItems: 'center',
//   },
//   saveButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   // Confetti Modal
//   confettiModal: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   confettiContent: {
//     backgroundColor: '#fff',
//     padding: 30,
//     borderRadius: 20,
//     alignItems: 'center',
//     margin: 20,
//   },
//   confettiTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#333',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   confettiMessage: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 24,
//   },
//   continueButton: {
//     backgroundColor: '#FF7518',
//     paddingHorizontal: 32,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   continueButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   // Loading States
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 16,
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#666',
//   },
//   customMarker: {
//     alignItems: 'center',
//   },
// });

// export default AddressEditScreen;


