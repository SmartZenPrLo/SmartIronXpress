import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Linking, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import VersionCheck from 'react-native-version-check';

const AppUpdateChecker = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        setIsLoading(true);
        const currentVersion = await VersionCheck.getCurrentVersion();
        const latestVersion = await VersionCheck.getLatestVersion();
        const storeUrl = await VersionCheck.getStoreUrl();

        if (!currentVersion || !latestVersion) {
          console.warn('Version info is not available.');
          return;
        }

        const updateNeeded = await VersionCheck.needUpdate({
          currentVersion,
          latestVersion,
        });

        if (updateNeeded?.isNeeded) {
          setStoreUrl(storeUrl);
          setIsUpdateAvailable(true);
        }
      } catch (error) {
        console.error('Error checking for update:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkForUpdate();
  }, []);

  if (!isUpdateAvailable || isLoading) return null;

  return (
    <Modal transparent={true} visible={isUpdateAvailable} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>New Update Available</Text>
          <Text style={styles.message}>
            A new version of the app is available. Please update to enjoy the latest features and improvements.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={() => Linking.openURL(storeUrl)}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Update Now</Text>
            </TouchableOpacity>
            
            {Platform.OS === 'android' && (
              <TouchableOpacity 
                style={styles.laterButton}
                onPress={() => setIsUpdateAvailable(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.laterButtonText}>Later</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    color: '#666',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
  },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  laterButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppUpdateChecker;