import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import apiClient from '../api/client';
import tokens from '../theme/tokens';
import BackgroundGlow from '../components/BackgroundGlow';
import GlassHeader from '../components/GlassHeader';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import { useModal } from '../contexts/ModalContext';

export default function ScanReceiptScreen() {
  const { showModal } = useModal();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [activeStep, setActiveStep] = useState(0); // 1: Uploading, 2: OCR Extracting, 3: Completed

  const pickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          showModal({
            title: 'Permission needed',
            message: 'Camera permission is required to take photos.',
            type: 'error',
          });
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          showModal({
            title: 'Permission needed',
            message: 'Gallery permission is required to choose photos.',
            type: 'error',
          });
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0]);
        setStatus('');
        setActiveStep(0);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showModal({
        title: 'Error',
        message: 'Failed to pick image.',
        type: 'error',
      });
    }
  };

  const uploadReceipt = async () => {
    if (!image) return;

    setLoading(true);
    setActiveStep(1);
    setStatus('Uploading receipt image...');

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
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const uploadData = await response.json();
      console.log('[Upload API Response]', uploadData);
      const jobId = uploadData.job_id;

      if (!jobId) {
        throw new Error('No job ID returned from server.');
      }

      setActiveStep(2);
      setStatus('AI is extracting merchant, date & total...');

      // Polling loop
      let isComplete = false;
      let finalStatus = '';

      while (!isComplete) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const statusResponse = await fetch(
          `${apiClient.defaults.baseURL}/transactions/jobs/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!statusResponse.ok) {
          throw new Error('Failed to check job status');
        }

        const statusData = await statusResponse.json();
        console.log('[Polling API Response]', statusData);

        const currentStatus = (statusData.status || '').toUpperCase();
        if (currentStatus === 'COMPLETED') {
          isComplete = true;
          setActiveStep(3);
          finalStatus = 'Success! Receipt logged as a transaction.';
        } else if (currentStatus === 'FAILED') {
          isComplete = true;
          throw new Error(statusData.error_message || 'OCR processing failed on the backend.');
        } else {
          setStatus('Analyzing line items & totals... please wait.');
        }
      }

      setStatus(finalStatus);
      setImage(null);
      showModal({
        title: 'Success',
        message: 'Your receipt was successfully processed and logged as an expense.',
        type: 'success',
      });
    } catch (error) {
      console.error('Upload error:', error);
      setStatus(error.message || 'Failed to process receipt.');
      showModal({
        title: 'Upload Failed',
        message: error.message || 'An error occurred during receipt processing.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundGlow>
      <GlassHeader
        title="Scan Receipt"
        subtitle="Automatic AI expense extractor"
        badge="SMART OCR"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveWrapper}>
          {/* Viewfinder Glass Container */}
          <View style={styles.viewfinderContainer}>
            {/* Viewfinder Corner Highlights */}
            <View style={[styles.cornerBracket, styles.topLeftBracket]} />
            <View style={[styles.cornerBracket, styles.topRightBracket]} />
            <View style={[styles.cornerBracket, styles.bottomLeftBracket]} />
            <View style={[styles.cornerBracket, styles.bottomRightBracket]} />

            {image ? (
              <View style={styles.previewWrapper}>
                <Image source={{ uri: image.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.clearImagePill}
                  onPress={() => setImage(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={16} color="#FFF" />
                  <Text style={styles.clearImageText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholderBox}>
                <View style={styles.scannerIconCircle}>
                  <Ionicons name="scan-outline" size={42} color={tokens.colors.primaryLight} />
                </View>
                <Text style={styles.placeholderTitle}>Position Receipt Here</Text>
                <Text style={styles.placeholderSubtitle}>
                  Take a clear photo or select a receipt from your device
                </Text>
              </View>
            )}
          </View>

          {/* Capture Actions */}
          <View style={styles.actionsRow}>
            <GlassButton
              title="Gallery"
              onPress={() => pickImage(false)}
              variant="secondary"
              icon="images-outline"
              disabled={loading}
              style={styles.actionBtn}
            />
            <GlassButton
              title="Take Photo"
              onPress={() => pickImage(true)}
              variant="secondary"
              icon="camera-outline"
              disabled={loading}
              style={styles.actionBtn}
            />
          </View>

          {/* AI Progress Tracker Card (when active) */}
          {loading && (
            <GlassCard variant="highlight" style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <ActivityIndicator size="small" color={tokens.colors.primaryLight} />
                <Text style={styles.progressTitle}>Processing Receipt</Text>
              </View>

              <View style={styles.stepRow}>
                <View
                  style={[
                    styles.stepBadge,
                    activeStep >= 1 && styles.stepBadgeActive,
                  ]}
                >
                  <Text style={styles.stepNum}>1</Text>
                </View>
                <View
                  style={[
                    styles.stepLine,
                    activeStep >= 2 && styles.stepLineActive,
                  ]}
                />
                <View
                  style={[
                    styles.stepBadge,
                    activeStep >= 2 && styles.stepBadgeActive,
                  ]}
                >
                  <Text style={styles.stepNum}>2</Text>
                </View>
                <View
                  style={[
                    styles.stepLine,
                    activeStep >= 3 && styles.stepLineActive,
                  ]}
                />
                <View
                  style={[
                    styles.stepBadge,
                    activeStep >= 3 && styles.stepBadgeActive,
                  ]}
                >
                  <Text style={styles.stepNum}>3</Text>
                </View>
              </View>

              <Text style={styles.statusDescription}>{status}</Text>
            </GlassCard>
          )}

          {/* Submit / Extract Button */}
          {image && !loading && (
            <GlassButton
              title="Extract & Log Expense"
              onPress={uploadReceipt}
              loading={loading}
              variant="primary"
              size="lg"
              icon="sparkles"
              style={styles.uploadButton}
            />
          )}

          {/* Tips Glass Card */}
          <GlassCard variant="subtle" style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={16} color={tokens.colors.warning} />
              <Text style={styles.tipsTitle}>Tips for Best Results</Text>
            </View>
            <Text style={styles.tipsText}>
              • Lay receipt flat in good lighting{'\n'}
              • Ensure total amount and merchant name are visible{'\n'}
              • Avoid shadows or blurry angles
            </Text>
          </GlassCard>
        </View>
      </ScrollView>
    </BackgroundGlow>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: tokens.spacing.md,
    paddingBottom: 110,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  viewfinderContainer: {
    height: 320,
    width: '100%',
    backgroundColor: tokens.colors.glassCard,
    borderRadius: tokens.borderRadius.xl,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
    position: 'relative',
    marginBottom: tokens.spacing.md,
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: tokens.colors.primaryLight,
  },
  topLeftBracket: {
    top: 14,
    left: 14,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  topRightBracket: {
    top: 14,
    right: 14,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  bottomLeftBracket: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  bottomRightBracket: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  placeholderBox: {
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
  },
  scannerIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.primaryGlow,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.text,
    marginBottom: 4,
  },
  placeholderSubtitle: {
    fontSize: 13,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  previewWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  clearImagePill: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: tokens.borderRadius.round,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorderHighlight,
    gap: 6,
  },
  clearImageText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  uploadButton: {
    marginBottom: tokens.spacing.md,
  },
  progressCard: {
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    alignItems: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: tokens.spacing.md,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: tokens.spacing.sm,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: tokens.colors.glassLight,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primaryLight,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  stepLine: {
    width: 50,
    height: 2,
    backgroundColor: tokens.colors.glassLight,
  },
  stepLineActive: {
    backgroundColor: tokens.colors.primary,
  },
  statusDescription: {
    color: tokens.colors.primaryLight,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: tokens.spacing.sm,
  },
  tipsCard: {
    padding: tokens.spacing.md,
    marginTop: tokens.spacing.xs,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: tokens.spacing.xs,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.warning,
  },
  tipsText: {
    fontSize: 12,
    color: tokens.colors.textMuted,
    lineHeight: 18,
  },
});
