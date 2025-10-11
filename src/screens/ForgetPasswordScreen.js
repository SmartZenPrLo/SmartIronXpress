import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_FORGET_USER_PASSWORD_URL } from '../api';
import Icon from '@react-native-vector-icons/material-icons';
import Icons from '@react-native-vector-icons/fontawesome';
import { TextInput } from 'react-native-paper';
import { SafeAreaView } from "react-native-safe-area-context";

const PasswordInput = ({ label, value, onChangeText, visible, setVisible, error }) => (
  <TextInput
    label={label}
    value={value}
    onChangeText={onChangeText}
    secureTextEntry={!visible}
    style={styles.input}
    mode="outlined"
    outlineColor="#ADB2D4"
    activeOutlineColor="#46345B"
    theme={{ colors: { primary: '#46345B', text: '#000000' } }}
    error={!!error}
    right={
      <TextInput.Icon
        icon={() => (
          <Icons
            name={visible ? "eye" : "eye-slash"}
            size={20}
            color="#73788B"
          />
        )}
        onPress={() => setVisible(!visible)}
        forceTextInputFocus={false}
      />
    }
  />
);

const ForgetPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber } = route.params;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [modalVisible, setModalVisible] = useState(false); // ✅ modal state

  const validatePassword = () => {
    let tempErrors = {};
    if (!newPassword) tempErrors.newPassword = "Password is required";
    else if (newPassword.length < 6) tempErrors.newPassword = "Password must be at least 6 characters";
    if (!confirmPassword) tempErrors.confirmPassword = "Please confirm your password";
    else if (newPassword !== confirmPassword) tempErrors.confirmPassword = "Passwords do not match";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const resetPassword = async () => {
    if (!validatePassword()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_FORGET_USER_PASSWORD_URL}/${phoneNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong. Please try again.");
      setLoading(false);
      setModalVisible(true); // show modal on success
    } catch (error) {
      setLoading(false);
      alert(error.message); // simple alert for errors
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    navigation.navigate('LoginScreen'); // navigate to login
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="#46345B" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            <Icon name="lock-reset" size={80} color="#2598d3" style={styles.lockIcon} />
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Create a new password for your Smart Iron Xpress account
            </Text>

            <View style={styles.phoneContainer}>
              <Icon name="phone" size={20} color="#73788B" style={styles.phoneIcon} />
              <Text style={styles.phoneText}>{phoneNumber}</Text>
            </View>

            <View style={styles.inputContainer}>
              <PasswordInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                visible={passwordVisible}
                setVisible={setPasswordVisible}
                error={errors.newPassword}
              />
              {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}

              <View style={{ marginTop: 15 }}>
                <PasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  visible={confirmPasswordVisible}
                  setVisible={setConfirmPasswordVisible}
                  error={errors.confirmPassword}
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="check" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Reset Password</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.securityInfoContainer}>
              <Icons name="shield" size={23} top={4} color="#46345B" />
              <Text style={styles.securityText}>
                Create a strong password with at least 6 characters, including uppercase letters, numbers, and symbols.
              </Text>
            </View>
          </View>

          {/* ✅ Success Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={handleModalClose}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <Icons name="check-circle" size={60} color="#4BB543" />
                <Text style={styles.modalTitle}>Success!</Text>
                <Text style={styles.modalMessage}>Your password has been updated successfully.</Text>
                <TouchableOpacity style={styles.modalButton} onPress={handleModalClose}>
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flexGrow: 1, paddingBottom: 30 },
  header: { padding: 16 },
  backButton: { padding: 8 },
  contentContainer: { flex: 1, padding: 24, alignItems: 'center' },
  lockIcon: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#46345B', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#73788B', textAlign: 'center', marginBottom: 24 },
  phoneContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F3F7', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginBottom: 24, width: '100%' },
  phoneIcon: { marginRight: 10 },
  phoneText: { fontSize: 16, color: '#000', fontWeight: '500' },
  inputContainer: { width: '100%', marginBottom: 24 },
  input: { backgroundColor: '#fff', width: '100%' },
  errorText: { color: '#FF6347', fontSize: 12, marginTop: 4, marginLeft: 2 },
  resetButton: { backgroundColor: '#F5761A', borderRadius: 8, padding: 16, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonIcon: { marginRight: 8 },
  securityInfoContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F2F3F7', padding: 16, borderRadius: 8, width: '100%' },
  securityText: { fontSize: 14, color: '#73788B', marginLeft: 8, flex: 1 },

  // Modal styles
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginVertical: 12, color: '#46345B' },
  modalMessage: { fontSize: 16, textAlign: 'center', color: '#73788B', marginBottom: 20 },
  modalButton: { backgroundColor: '#F5761A', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default ForgetPasswordScreen;
