import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../utils/theme';
import { PatientStackParamList } from '../../types';
import { Card, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';

type FaceScanScreenProps = {
  navigation: NativeStackNavigationProp<PatientStackParamList, 'FaceScan'>;
};

export const FaceScanScreen: React.FC<FaceScanScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  const handleStartScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setConfidence(null);

    // Simulate face scan
    setTimeout(() => {
      setIsScanning(false);
      // Simulate random result for demo
      const results = ['Healthy', 'Fatigued', 'Normal'];
      const randomResult = results[Math.floor(Math.random() * results.length)];
      const randomConfidence = Math.floor(Math.random() * 20) + 80; // 80-99%

      setScanResult(randomResult);
      setConfidence(randomConfidence);

      Alert.alert(
        'Scan Complete',
        `Result: ${randomResult}\nConfidence: ${randomConfidence}%`,
        [{ text: 'OK' }]
      );
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Face Scan</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="camera" size={32} color={colors.primary} />
          </View>
          <Text style={styles.infoTitle}>AI-Powered Health Check</Text>
          <Text style={styles.infoText}>
            Our advanced AI analyzes your facial features to provide health insights.
            This is for informational purposes only and is not a medical diagnosis.
          </Text>
        </Card>

        <View style={styles.scanContainer}>
          <View style={[styles.scanFrame, isScanning && styles.scanFrameActive]}>
            <Ionicons
              name="person"
              size={80}
              color={isScanning ? colors.primary : colors.textLight}
            />
            {isScanning && (
              <View style={styles.scanningOverlay}>
                <Text style={styles.scanningText}>Scanning...</Text>
              </View>
            )}
          </View>
        </View>

        <Button
          title={isScanning ? 'Scanning...' : 'Start Face Scan'}
          onPress={handleStartScan}
          loading={isScanning}
          disabled={isScanning}
          style={styles.scanButton}
        />

        {scanResult && (
          <Card style={styles.resultCard}>
            <Text style={styles.resultTitle}>Scan Results</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Status:</Text>
              <Text
                style={[
                  styles.resultValue,
                  {
                    color:
                      scanResult === 'Healthy'
                        ? colors.success
                        : scanResult === 'Normal'
                        ? colors.warning
                        : colors.error,
                  },
                ]}
              >
                {scanResult}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Confidence:</Text>
              <Text style={styles.resultValue}>{confidence}%</Text>
            </View>
            <Text style={styles.disclaimer}>
              * This is not a medical diagnosis. Please consult a healthcare professional for medical advice.
            </Text>
          </Card>
        )}

        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for Accurate Scan</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.tipText}>Ensure good lighting</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.tipText}>Face the camera directly</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.tipText}>Remove glasses or hat if possible</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.tipText}>Keep a neutral expression</Text>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  infoCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  infoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  scanContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.border,
    ...shadows.medium,
  },
  scanFrameActive: {
    borderColor: colors.primary,
  },
  scanningOverlay: {
    position: 'absolute',
    bottom: 20,
  },
  scanningText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  scanButton: {
    marginBottom: spacing.lg,
  },
  resultCard: {
    marginBottom: spacing.lg,
  },
  resultTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  resultLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  resultValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  tipsCard: {
    backgroundColor: colors.secondary + '10',
  },
  tipsTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
