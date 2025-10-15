import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';
import { API_LAUNDRY_LIST_URL, API_GET_LOGO_FILENAME_URL } from '../api';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const NearbyLaundryScreen = () => {
  const navigation = useNavigation();
  const [laundry, setLaundry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoFilename, setLogoFilename] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await fetchLaundryDetails();
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLaundryDetails = async () => {
    try {
      const response = await fetch(API_LAUNDRY_LIST_URL);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Ironing details');
      }

      const result = await response.json();
      
      if (result.data && result.data.length > 0) {
        const company = result.data[0];
        setLaundry(company);
        await fetchLogoFilename(company.CompanyId);
      }
    } catch (err) {
      console.error('Error fetching Ironing details:', err);
    }
  };

  const fetchLogoFilename = async (companyId) => {
    try {
      const url = `${API_GET_LOGO_FILENAME_URL}?companyId=${companyId}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.fileName) {
          setLogoFilename(data.fileName);
        }
      }
    } catch (err) {
      console.error('Error fetching logo:', err);
    }
  };

  const getLogoUrl = filename => `${API_BASE_URL}/uploads/logo/${filename}`;

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#F5761A" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Content */}
        <View style={styles.content}>
          {/* Company Card */}
          <View style={styles.companyCard}>
            {logoFilename ? (
              <Image
                source={{ uri: getLogoUrl(logoFilename) }}
                style={styles.logo}
                onError={() => setLogoFilename(null)}
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Icon name="iron" size={50} color="#F5761A" />
              </View>
            )}
            
            <Text style={styles.companyName}>
              {laundry?.CompanyName || 'Ironing Service'}
            </Text>
            
            <Text style={styles.companyDescription}>
              Premium Fastest ironing services with fast turnaround times
            </Text>

            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Quality Guaranteed</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Fast Delivery</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Eco-Friendly</Text>
              </View>
            </View>
          </View>

          {/* Order Button */}
          <TouchableOpacity 
            style={styles.orderButton}
            onPress={() => navigation.navigate('PlaceOrderScreen', { laundry })}
          >
            <Icon name="add-shopping-cart" size={24} color="#fff" />
            <Text style={styles.orderButtonText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  companyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 118, 26, 0.1)',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#F5761A',
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#F5761A',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  companyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  features: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    fontWeight: '500',
  },
  orderButton: {
    backgroundColor: '#F5761A',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F5761A',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
export default NearbyLaundryScreen;