import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createPaymentIntent, confirmPayment } from '../services/stripeService';
import { showToast } from '../store/slices/toastSlice';
import { useDispatch } from 'react-redux';

export default function PaymentScreen({ navigation, route }) {
  const theme = useTheme();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const dispatch = useDispatch();
  const { token, user } = useSelector(state => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);
  
  // Get order details from route params
  const { orderDetails } = route.params || {};
  const { orderId, amount, currency = 'usd', orderItems } = orderDetails || {};

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  const initializePaymentSheet = async () => {
    if (!token || !orderId || !amount) {
      Alert.alert('Error', 'Missing order information');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);

      // Create payment intent
      const response = await createPaymentIntent(token, amount, orderId, currency);
      
      if (response.success) {
        const { clientSecret, paymentIntentId } = response;
        
        setPaymentIntent({
          clientSecret,
          paymentIntentId
        });

        const { error } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'Kaarigari',
          allowsDelayedPaymentMethods: true,
          defaultBillingDetails: {
            name: user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.email || 'Customer',
            email: user?.email,
          },
        });

        if (error) {
          console.error('Payment sheet initialization error:', error);
          Alert.alert('Error', 'Failed to initialize payment');
          navigation.goBack();
        }
      } else {
        Alert.alert('Error', 'Failed to create payment intent');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Initialize payment error:', error);
      Alert.alert('Error', 'Failed to initialize payment');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (processing) return;

    try {
      setProcessing(true);

      const { error } = await presentPaymentSheet();

      if (error) {
        console.error('Payment sheet error:', error);
        Alert.alert('Payment Failed', error.message);
      } else {
        // Payment successful - confirm with backend
        if (paymentIntent?.paymentIntentId) {
          try {
            await confirmPayment(token, paymentIntent.paymentIntentId);
            
            dispatch(showToast({
              message: 'Payment successful! Order confirmed.',
              type: 'success'
            }));

            // Navigate to order confirmation or orders list
            navigation.reset({
              index: 0,
              routes: [{ name: 'Orders' }],
            });
          } catch (confirmError) {
            console.error('Payment confirmation error:', confirmError);
            dispatch(showToast({
              message: 'Payment processed but confirmation failed. Please contact support.',
              type: 'warning'
            }));
          }
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Initializing payment...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Order Summary</Text>
          
          {orderItems && orderItems.length > 0 ? (
            orderItems.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <Text style={[styles.itemName, { color: theme.text }]}>
                  {item.productName || item.name || 'Product'}
                </Text>
                <Text style={[styles.itemDetails, { color: theme.textSecondary }]}>
                  {item.quantity || 1} x {formatAmount(item.price || 0)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.noItemsText, { color: theme.textSecondary }]}>
              Order items not available
            </Text>
          )}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total Amount</Text>
            <Text style={[styles.totalAmount, { color: theme.primary }]}>
              {formatAmount(amount)}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Payment Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Secure payment powered by Stripe
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Your payment information is encrypted and secure
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Accepts all major credit and debit cards
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Billing Details</Text>
          
          <Text style={[styles.billingText, { color: theme.text }]}>
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.email || 'Customer'
            }
          </Text>
          <Text style={[styles.billingEmail, { color: theme.textSecondary }]}>
            {user?.email || 'No email provided'}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: theme.primary }]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay {formatAmount(amount)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  itemDetails: {
    fontSize: 14,
  },
  noItemsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  billingText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  billingEmail: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  payButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
