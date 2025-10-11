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
  ScrollView
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useNavigation, useRoute } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';

import { SafeAreaView } from 'react-native-safe-area-context';

Geocoder.init("AIzaSyB0sMzzE-VfCGCX71_So97P3oRYmRFJvKE");
const MapScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mapRef = useRef(null);
  const confettiRef = useRef(null);

  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markerPosition, setMarkerPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [customAddressName, setCustomAddressName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [location, setLocation] = useState(null);
  console.log("Location in the mapscreen---------------------------", location);
  const [isUserSelected, setIsUserSelected] = useState(false);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfettiModal, setShowConfettiModal] = useState(false);
  const [confirmedLocationData, setConfirmedLocationData] = useState(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

  const { phoneNumber } = route.params;
  console.log("Phone number in Map Screen----------------", phoneNumber);
  
  const getLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLoading(false);
        setErrorMessage("Please enable location permissions in your device settings.");
        setShowErrorModal(true);
        return;
      }
  
      const getPositionPromise = () => {
        return new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(
            (position) => resolve(position),
            (highAccuracyError) => {
              console.log('High accuracy failed, trying low accuracy', highAccuracyError);
              Geolocation.getCurrentPosition(
                (position) => resolve(position),
                (error) => reject(error),
                { 
                  enableHighAccuracy: false, 
                  timeout: 45000, 
                  maximumAge: 10000,
                  distanceFilter: 10
                }
              );
            },
            { 
              enableHighAccuracy: true, 
              timeout: 30000, 
              maximumAge: 5000,
              distanceFilter: 0
            }
          );
        });
      };
  
      const position = await getPositionPromise();
      console.log("Position:", position);
      const { latitude, longitude } = position.coords;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      };
      
      setRegion(newRegion);
      setMarkerPosition({ latitude, longitude });
      setLocation(position.coords);
      getAddressFromCoordinates({ latitude, longitude });
      setLoading(false);
  
      mapRef.current?.animateToRegion(newRegion, 500);
    } catch (error) {
      console.error("Location Error:", error);
      setLoading(false);
      
      let errorMsg = "Unable to retrieve location";
      switch(error.code) {
        case 1:
          errorMsg = "Location permission denied. Please enable in settings.";
          break;
        case 2:
          case error.POSITION_UNAVAILABLE:
          errorMsg = "Location services are disabled or unavailable. Turn on your Location";
          break;
        case 3:
        case error.TIMEOUT:
          errorMsg = "Location request timed out. Check your network and GPS.";
          break;
        case 4:
        case error.ACTIVITY_NULL:
          errorMsg = "Location service unavailable (app may be in background).";
          break;
      }
      
      setError(errorMsg);
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  };
  
  const requestLocationPermission = async () => {
    try {
      let permission = Platform.OS === 'android' 
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION 
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      
      const status = await check(permission);
      
      if (status === RESULTS.GRANTED) {
        return true;
      }
      
      const requestResult = await request(permission);
      return requestResult === RESULTS.GRANTED;
    } catch (err) {
      console.error("Permission error:", err);
      return false;
    }
  };
  
  useEffect(() => {
    let watchId;
    
    const startWatching = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;
  
      watchId = Geolocation.watchPosition(
        (position) => {
          if (!isUserSelected) { 
            const { latitude, longitude } = position.coords;
            setRegion({
              latitude,
              longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.0121,
            });
            setMarkerPosition({ latitude, longitude });
            setLocation(position.coords);
            getAddressFromCoordinates({ latitude, longitude });
            mapRef.current?.animateToRegion({
              latitude,
              longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.0121,
            }, 500);
          }
        },
        (error) => {
          console.log("Watch Position Error:", error);
        },
        { 
          enableHighAccuracy: true, 
          distanceFilter: 10, 
          interval: 10000,
          timeout: 15000 
        }
      );
    }; 
    startWatching();
    return () => {
      if (watchId) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [isUserSelected]); 
  useEffect(() => {
    const checkLocationPermission = async () => {
      const permissionStatus = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      console.log("Location Permission status-------------------", permissionStatus);
      if (permissionStatus === RESULTS.GRANTED) {
        getLocation();
      } else {
        const requestStatus = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        if (requestStatus === RESULTS.GRANTED) {
          getLocation();
        } else {
          setError('Permission denied');
        }
      }
    };
    checkLocationPermission();
  }, []);
  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setIsUserSelected(true);
    setMarkerPosition(coordinate);
    getAddressFromCoordinates(coordinate);
    setCustomAddressName('');
    setAddress1('');
    setAddress2('');
    setPincode('');
  
    const newRegion = {
      ...coordinate,
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    };
  
    setRegion(newRegion); 
    mapRef.current?.animateToRegion(newRegion, 500);
  };  

  const getAddressFromCoordinates = async (coordinate) => {
    try {
      console.log("Fetching address for:------------------------", coordinate);
      setLoading(true);
      setAddress("Looking up address...");
  
      // 1. Try Google Maps Geocoding API
      const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=AIzaSyA2A_NRpPFj8JjL5kWIY8ItNJXJoRC95wE`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log("Google API Response:---------------------------", data);
  
      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        const fullAddress = result.formatted_address;
        
        let streetAddress = "";
        let area = "";
        let pincode = "";
  
        result.address_components.forEach(comp => {
          if (comp.types.includes("street_number") || comp.types.includes("route")) {
            streetAddress = streetAddress ? `${streetAddress} ${comp.long_name}` : comp.long_name;
          }
          if (comp.types.includes("sublocality") || comp.types.includes("locality")) {
            area = comp.long_name;
          }
          if (comp.types.includes("postal_code")) {
            pincode = comp.long_name;
          }
        });
        if (!streetAddress) {
          const parts = fullAddress.split(',');
          streetAddress = parts.slice(0, 2).join(', ').trim();
        }
        setAddress(fullAddress);
        setAddress1(streetAddress);
        setAddress2(area);
        setPincode(pincode);
        return;
      }
      console.log("Trying React Native Geocoding fallback...");
      const geocoderResponse = await Geocoder.from(coordinate.latitude, coordinate.longitude);
      if (geocoderResponse.results?.length > 0) {
        const fallbackAddress = geocoderResponse.results[0].formatted_address;
        setAddress(fallbackAddress);
        setAddress1(fallbackAddress.split(',')[0]?.trim());
        return;
      }
      setAddress("Address details not available");
    } catch (error) {
      console.error("Address fetch failed:", error);
      
      if (error.origin?.error_message?.includes("enable Billing")) {
        setAddress("API configuration error - billing not enabled");
        Alert.alert(
          "API Error",
          "Please enable billing for Google Maps API in the developer console",
          [{ text: "OK" }]
        );
      } else {
        setAddress("Couldn't retrieve address");
      }
    }finally {
      setLoading(false);
    }
  }; 
  
 const confirmLocation = () => {
    if (markerPosition) {
      const locationData = {
        phoneNumber,
        latitude: markerPosition.latitude,
        longitude: markerPosition.longitude,
        address1,
        address2,
        pincode,
        fullAddress: customAddressName 
          ? `${customAddressName}\n${address1 ? address1 + '\n' : ''}${address2 ? address2 + '\n' : ''}${pincode ? 'PIN: ' + pincode : ''}` 
          : address
      };
      setConfirmedLocationData(locationData);
      setShowConfettiModal(true);
      if (confettiRef.current) {
        confettiRef.current.start();
      }
    } else {
      console.error('Please select a location on the map first');
    }
  };  
  
  const resetToCurrentLocation = () => {
    setIsUserSelected(false);
    setCustomAddressName('');
    setAddress1('');
    setAddress2('');
    setPincode('');
    getLocation();
  };
  
  const searchLocation = async () => {
    if (!searchText.trim()) {
      Alert.alert('Error', 'Please enter a location to search');
      return;
    }
    try {
      setSearchLoading(true);
      const response = await Geocoder.from(searchText);
      if (response.results.length === 0) {
        setSearchLoading(false);
        return;
      }
      const { lat, lng } = response.results[0].geometry.location;
      const coordinate = {
        latitude: lat,
        longitude: lng
      };
      
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      };
      setRegion(newRegion);
      setMarkerPosition(coordinate);
      setAddress(response.results[0].formatted_address);
      setCustomAddressName('');
      setAddress1('');
      setAddress2('');
      setPincode('');
      setIsUserSelected(true);
      mapRef.current?.animateToRegion(newRegion, 500);
    } catch (error) {
      console.log('Error searching location:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const openEditAddressModal = () => {
    setShowEditModal(true);
  };

  const saveCustomAddressName = () => {
    setShowEditModal(false);
  };
  const handleConfettiComplete = () => {
    if (confirmedLocationData) {
      navigation.navigate('RegisterScreen', confirmedLocationData);
      setShowConfettiModal(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#46345B" />
          <Text>Loading Location...</Text>
          {error && <Text style={styles.errorText}>Error: {error}</Text>}
          {error && error.includes('timed out') && (
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={getLocation}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a place"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={searchLocation}
              returnKeyType="search"
            />
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={searchLocation}
              disabled={searchLoading}
            >
              {searchLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome name="search" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          {!region ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#46345B" />
    <Text>Loading Map...</Text>
  </View>
) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            onPress={handleMapPress} 
          >
            {markerPosition && (
              <Marker
                coordinate={markerPosition}
                title={customAddressName || "Selected Location"}
                description={address}
                pinColor="red"
              >
                <View style={styles.customMarker}>
                  <View style={styles.markerPin}>
                    <FontAwesome name="map-pin" size={30} color="#FF0000" />
                  </View>
                  <View style={styles.markerShadow} />
                </View>
              </Marker>
            )}
          </MapView>
          )}
          <TouchableOpacity 
            style={styles.myLocationButton}
            onPress={resetToCurrentLocation}
          >
            <MaterialIcons name="my-location" size={24} color="#46345B" />
          </TouchableOpacity>
          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>
              <MaterialIcons name="location-on" size={18} color="#46345B" /> Selected Location
            </Text>
            {markerPosition ? (
              <>
                <View style={styles.addressRow}>
                  <View style={styles.addressTextContainer}>
                    {customAddressName ? (
                      <Text style={styles.customAddressText}>
                        <FontAwesome name="bookmark" size={14} color="#46345B" /> {customAddressName}
                      </Text>
                    ) : null}
                    {address1 ? (
                      <Text style={styles.userAddressText}>
                        <FontAwesome name="home" size={14} color="#73788B" /> {address1}
                      </Text>
                    ) : null}
                    {address2 ? (
                      <Text style={styles.userAddressText}>
                        {address2}
                      </Text>
                    ) : null}
                    {pincode ? (
                      <Text style={styles.userAddressText}>
                        <FontAwesome name="map-marker" size={14} color="#73788B" /> PIN: {pincode}
                      </Text>
                    ) : null}
                    <Text style={styles.coordinatesText}>
                      <MaterialIcons name="explore" size={14} color="#73788B" /> Lat: {markerPosition.latitude.toFixed(6)}, Lng: {markerPosition.longitude.toFixed(6)}
                    </Text>
                    <Text style={styles.addressText}>
                      <FontAwesome name="map" size={14} color="#73788B" /> {address || 'Fetching address...'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={openEditAddressModal}
                  >
                    <MaterialIcons name="edit" size={18} color="#46345B" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.placeholderText}>
                <MaterialIcons name="touch-app" size={14} color="#ADB2D4" /> Tap on the map to select a location
              </Text>
            )}
            
            <TouchableOpacity 
              style={[styles.confirmButton, !markerPosition && styles.disabledButton]} 
              onPress={confirmLocation}
              disabled={!markerPosition}
            >
              <FontAwesome name="check-circle" size={16} color="#fff" />
              <Text style={styles.confirmButtonText}> Confirm Location</Text>
            </TouchableOpacity>
          </View>
          <Modal
            visible={showEditModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowEditModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Address Details</Text>
                
                <ScrollView>
                  <Text style={styles.inputLabel}>Address Line 1</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="House/Flat No., Building, Street"
                    value={address1}
                    onChangeText={setAddress1}
                  />
                  
                  <Text style={styles.inputLabel}>Address Line 2</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Area, Landmark"
                    value={address2}
                    onChangeText={setAddress2}
                  />
                  
                  <Text style={styles.inputLabel}>PIN Code</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="6-digit PIN Code"
                    value={pincode}
                    onChangeText={setPincode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </ScrollView>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalSaveButton}
                    onPress={saveCustomAddressName}
                  >
                    <Text style={styles.modalSaveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <Modal
            visible={showConfettiModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowConfettiModal(false)}
          >
            <View style={styles.confettiModalOverlay}>
              <View style={styles.confettiModalContent}>
                <Text style={styles.confettiTitle}>Location Confirmed!</Text>
                <Text style={styles.confettiSubtitle}>
                  Latitude: {markerPosition?.latitude.toFixed(6)}
                  {'\n'}
                  Longitude: {markerPosition?.longitude.toFixed(6)}
                </Text>
                <Text style={styles.confettiAddress}>
                  {confirmedLocationData?.fullAddress}
                </Text>
                <TouchableOpacity 
                  style={styles.confettiButton}
                  onPress={handleConfettiComplete}
                >
                  <Text style={styles.confettiButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
              <ConfettiCannon
                ref={confettiRef}
                count={200}
                origin={{x: -10, y: 0}}
                autoStart={false}
                fadeOut={true}
                onAnimationEnd={handleConfettiComplete}
              />
            </View>
          </Modal>
            <Modal
                  visible={showErrorModal}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowErrorModal(false)}
                >
                  <View style={styles.errorModalOverlay}>
                    <View style={styles.errorModalContent}>
                      <MaterialIcons name="error-outline" size={60} color="#FF6B6B" />
                      <Text style={styles.errorModalTitle}>Location Error</Text>
                      <Text style={styles.errorModalMessage}>{errorMessage}</Text>
                      
                      <View style={styles.errorModalButtons}>
                        <TouchableOpacity 
                          style={styles.errorModalCancelButton}
                          onPress={() => setShowErrorModal(false)}
                        >
                          <Text style={styles.errorModalCancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.errorModalRetryButton}
                          onPress={() => {
                            setShowErrorModal(false);
                            getLocation();
                          }}
                        >
                          <Text style={styles.errorModalRetryButtonText}>Retry</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#46345B',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 76,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '5px 5px 10px #000000',
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#46345B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myLocationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '5px 5px 10px #000000',
    zIndex: 1,
  },
  addressCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    boxShadow: '5px 5px 10px #000000',
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addressTextContainer: {
    flex: 1,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#73788B',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 14,
    color: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
  },
  customAddressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 4,
  },
  userAddressText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 14,
    color: '#ADB2D4',
    fontStyle: 'italic',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#F0F0F7',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    height:40,
  },
  confirmButton: {
    backgroundColor: '#F5761A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ADB2D4',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  customMarker: {
    alignItems: 'center',
  },
  markerPin: {
    bottom: 0,
  },
  markerShadow: {
    width: 8,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    position: 'absolute',
    bottom: -4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    boxShadow: '5px 5px 10px #000000',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F7',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#73788B',
    fontWeight: 'bold',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#46345B',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  confettiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(70, 52, 91, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiModalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    zIndex: 10,
  },
  confettiTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#46345B',
    marginBottom: 15,
    textAlign: 'center',
  },
  confettiSubtitle: {
    fontSize: 16,
    color: '#73788B',
    marginBottom: 15,
    textAlign: 'center',
  },
  confettiAddress: {
    fontSize: 14,
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  confettiButton: {
    backgroundColor: 'green',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  confettiButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  errorModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 15,
    marginBottom: 10,
  },
  errorModalMessage: {
    fontSize: 16,
    color: '#46345B',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  errorModalCancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F7',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  errorModalCancelButtonText: {
    color: '#73788B',
    fontWeight: 'bold',
  },
  errorModalRetryButton: {
    flex: 1,
    backgroundColor: '#46345B',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  errorModalRetryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
export default MapScreen;