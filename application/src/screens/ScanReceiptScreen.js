import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';
import { theme } from '../theme/colors';

export default function ScanReceiptScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const pickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Gallery permission is required to choose photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0]);
        setStatus(''); // Reset status
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const uploadReceipt = async () => {
    if (!image) return;

    setLoading(true);
    setStatus('Uploading and parsing receipt...');

    const formData = new FormData();
    formData.append('file', {
      uri: image.uri,
      name: image.fileName || `receipt-${Date.now()}.jpg`,
      type: image.mimeType || 'image/jpeg',
    });

    try {
      const token = await SecureStore.getItemAsync('userToken');
      
      const response = await fetch(`${apiClient.defaults.baseURL}/transactions/upload/async`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Do NOT set Content-Type manually. Fetch will automatically set it to multipart/form-data with the correct boundary!
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const uploadData = await response.json();
      console.log('[Upload API Response]', uploadData);
      const jobId = uploadData.job_id;
      
      if (!jobId) {
        throw new Error("No job ID returned from server.");
      }

      setStatus('Receipt uploaded! Extracting expenses (this may take a moment)...');

      // Polling loop
      let isComplete = false;
      let finalStatus = '';
      
      while (!isComplete) {
        // Wait 2 seconds before polling
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`${apiClient.defaults.baseURL}/transactions/jobs/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!statusResponse.ok) {
          throw new Error('Failed to check job status');
        }
        
        const statusData = await statusResponse.json();
        console.log('[Polling API Response]', statusData);
        
        if (statusData.status.toUpperCase() === 'COMPLETED') {
          isComplete = true;
          finalStatus = 'Success! Receipt processed and logged.';
        } else if (statusData.status.toUpperCase() === 'FAILED') {
          isComplete = true;
          throw new Error(statusData.error_message || 'OCR processing failed on the backend.');
        } else {
          // Still PENDING or PROCESSING
          setStatus('Still extracting... please wait.');
        }
      }

      setStatus(finalStatus);
      setImage(null);
      Alert.alert('Success', 'Your receipt was successfully processed and logged as an expense.');
      
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('Failed to upload receipt.');
      Alert.alert('Upload Failed', error.message || 'An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Receipt</Text>
      <Text style={styles.subtitle}>Take a photo of your receipt to auto-extract expenses</Text>

      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No receipt selected</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => pickImage(false)}>
          <Text style={styles.secondaryButtonText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => pickImage(true)}>
          <Text style={styles.secondaryButtonText}>Camera</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={uploadReceipt}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : (
            <Text style={styles.primaryButtonText}>Upload Receipt</Text>
          )}
        </TouchableOpacity>
      )}

      {status ? <Text style={styles.statusText}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    paddingTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl,
  },
  imageContainer: {
    height: 300,
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    color: theme.colors.success,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    fontWeight: '500',
  }
});
