import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Modal,
  TextInput,
  RefreshControl,
  Dimensions
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_USER_INFO_URL, API_USER_UPDATE_URL, API_USER_DELETE_URL } from '../api';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const ErrorModal = ({ visible, message, onClose }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.errorModalContainer}>
        <View style={styles.errorModalContent}>
          <View style={styles.errorIconContainer}>
            <Icon name="error-outline" size={40} color="#FF6B6B" />
          </View>
          <Text style={styles.errorModalTitle}>Oops!</Text>
          <Text style={styles.errorModalMessage}>{message}</Text>
          <TouchableOpacity 
            style={styles.errorModalButton} 
            onPress={onClose}
          >
            <Text style={styles.errorModalButtonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false); // Add this line
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
const [userAddress, setUserAddress] = useState('');

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_USER_INFO_URL}/${userId}`);
      const data = await response.json();
      console.log("user data -=-=-=-=-=-=-=-=",data);
      if (response.ok) {
        setUserData(data);
        setEditedName(data.Username);
        setEditedEmail(data.Email);
              setUserAddress(data.FullAddress || '');

      } else {
        console.error('Error fetching user data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const showErrorModal = (message) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!editedName.trim() || !editedEmail.trim()) {
        showErrorModal('All fields are required');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedEmail)) {
        showErrorModal('Please enter a valid email address');
        return;
      }

      const response = await fetch(`${API_USER_UPDATE_URL}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Username: editedName,
          Email: editedEmail
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUserData({
          ...userData,
          Username: editedName,
          Email: editedEmail
        });
        setEditModalVisible(false);
      } else {
        showErrorModal(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorModal('Something went wrong. Please try again later.');
    }
  };

const handleDeleteAccount = () => {
  setDeleteModalVisible(true);
};

// Add this new function for the final confirmation
const handleFinalDeleteConfirmation = () => {
  setDeleteModalVisible(false);
  setDeleteConfirmModalVisible(true);
};

const confirmDeleteAccount = async () => {
  try {
    const response = await fetch(`${API_USER_DELETE_URL}/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('BranchID');

      setDeleteConfirmModalVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    } else {
      const data = await response.json();
      showErrorModal(data.message || 'Failed to delete account');
      setDeleteConfirmModalVisible(false);
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    showErrorModal('Something went wrong. Please try again later.');
    setDeleteConfirmModalVisible(false);
  }
};

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('BranchID');
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };
const handleAddressPress = () => {
  navigation.navigate('AddressEditScreen', { 
    existingAddress: userData.FullAddress,
    Latitude: userData.Latitude,
    Longitude: userData.Longitude, // Your API's FullAddress field
    userId: userId // Pass userId for API updates
  });
};
  const renderProfileOption = (iconName, title, subtitle, onPress, color = '#FF7518') => (
    <TouchableOpacity style={styles.profileOption}>
      <View style={[styles.optionIconContainer, { backgroundColor: `${color}15` }]}>
        <Icon name={iconName} size={22} color={color} />
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      {/* <Icon name="chevron-right" size={20} color="#999" /> */}
    </TouchableOpacity>
  );
  
  const renderProfileOptionLocation = (iconName, title, subtitle, onPress, color = '#FF7518') => (
    <TouchableOpacity style={styles.profileOption} onPress={handleAddressPress} >
      <View style={[styles.optionIconContainer, { backgroundColor: `${color}15` }]}>
        <Icon name={iconName} size={22} color={color} />
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      <Icon name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingSpinner}>
            <Icon name="account-circle" size={60} color="#FF7518" />
          </View>
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={60} color="#FF6B6B" />
        <Text style={styles.errorTitle}>User not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FF7518" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Icon name="edit" size={20} color="#FF7518" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#FF7518']}
            tintColor="#FF7518"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Text style={styles.userName}>{userData.Username}</Text>
          <Text style={styles.userEmail}>{userData.Email}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.OrderCount || 0}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDate(userData.CreatedAt)}</Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
          </View>
        </View>

        {/* Profile Options */}
        <View style={styles.optionsSection}>
          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            {renderProfileOption('phone', 'Phone Number', userData.PhoneNo || 'Not provided', null, '#4ECDC4')}
            {renderProfileOptionLocation('location-on', 'Address', userData.FullAddress || 'Not provided', null, '#45B7D1')}
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <View style={[styles.optionIconContainer, { backgroundColor: '#FF751815' }]}>
                <Icon name="logout" size={22} color="#FF7518" />
              </View>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
              <View style={[styles.optionIconContainer, { backgroundColor: '#FF6B6B15' }]}>
                <Icon name="delete-outline" size={22} color="#FF6B6B" />
              </View>
              <Text style={styles.deleteAccountText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your full name"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={editedEmail}
                onChangeText={setEditedEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
{/* First Delete Warning Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={deleteModalVisible}
  onRequestClose={() => setDeleteModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Delete Account</Text>
        <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.warningContainer}>
        <Icon name="warning" size={40} color="#FF6B6B" />
        <Text style={styles.deleteWarningText}>
          Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
        </Text>
      </View>

      <View style={styles.modalButtonsContainer}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]} 
          onPress={() => setDeleteModalVisible(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modalButton, styles.deleteButton]} 
          onPress={confirmDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Yes, Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

{/* Final Confirmation Modal */}
{/* <Modal
  animationType="slide"
  transparent={true}
  visible={deleteConfirmModalVisible}
  onRequestClose={() => setDeleteConfirmModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Final Confirmation</Text>
        <TouchableOpacity onPress={() => setDeleteConfirmModalVisible(false)}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.warningContainer}>
        <Icon name="delete-forever" size={40} color="#FF6B6B" />
        <Text style={styles.deleteWarningText}>
          This is your last chance to cancel. Your account and all data will be permanently deleted. This action cannot be undone.
        </Text>
        
        <Text style={styles.finalWarningText}>
          Are you absolutely sure you want to proceed?
        </Text>
      </View>

      <View style={styles.modalButtonsContainer}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]} 
          onPress={() => setDeleteConfirmModalVisible(false)}
        >
          <Text style={styles.cancelButtonText}>No, Keep Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modalButton, styles.deleteButton]} 
          onPress={confirmDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Yes, Delete Forever</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal> */}

      <ErrorModal 
        visible={errorModalVisible} 
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    color: '#495057',
    marginTop: 10,
    marginBottom: 20,
    fontFamily: 'System',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#F5761A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  editButton: {
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Add this to your styles
finalWarningText: {
  textAlign: 'center',
  color: '#E74C3C',
  fontSize: 16,
  marginTop: 15,
  fontWeight: '600',
  lineHeight: 22,
  fontFamily: 'System',
},
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'System',
  },
  userEmail: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'System',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 15,
    borderRadius: 15,
    marginHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5761A',
    marginBottom: 4,
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'center',
    fontFamily: 'System',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E9ECEF',
  },
  optionsSection: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
    fontFamily: 'System',
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 2,
    fontFamily: 'System',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    fontFamily: 'System',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  logoutText: {
    fontSize: 16,
    color: '#F5761A',
    marginLeft: 15,
    fontWeight: '600',
    fontFamily: 'System',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteAccountText: {
    fontSize: 16,
    color: '#E74C3C',
    marginLeft: 15,
    fontWeight: '500',
    fontFamily: 'System',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: 'System',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: 'System',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    fontFamily: 'System',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  saveButton: {
    backgroundColor: '#F5761A',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  cancelButtonText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  warningContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FDEDED',
    borderRadius: 12,
    marginBottom: 20,
  },
  deleteWarningText: {
    textAlign: 'center',
    color: '#E74C3C',
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
    fontFamily: 'System',
  },
  errorModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  errorIconContainer: {
    marginBottom: 15,
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
    fontFamily: 'System',
  },
  errorModalMessage: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: 'System',
  },
  errorModalButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  errorModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default ProfileScreen;