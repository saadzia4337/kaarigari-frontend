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
import { createOrderAsync } from '../store/slices/ordersSlice';
import { formatOrderData } from '../services/orderService';

export default function PaymentScreen({ navigation, route }) {
  const theme = useTheme();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const dispatch = useDispatch();
  const { token, user } = useSelector(state => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [initError, setInitError] = useState(null);
  
  // Get order details from route params
  const { orderDetails } = route.params || {};
  const { items, totalAmount, currency = 'usd', shippingAddress, sellerName } = orderDetails || {};
  const amount = totalAmount;
  const orderItems = items;

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  // Retry payment initialization if it fails
  const retryPayment = () => {
    setInitError(null);
    setLoading(true);
    initializePaymentSheet();
  };

  const initializePaymentSheet = async () => {
    if (!token || !amount) {
      Alert.alert('Error', 'Missing order information');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);

      // Create unique payment intent with timestamp
      const uniqueOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const response = await createPaymentIntent(token, amount, uniqueOrderId, currency);
      
      if (response.success) {
        const { clientSecret, paymentIntentId, status } = response;
        
        // Check if payment intent is already in an invalid state
        if (status === 'succeeded') {
          Alert.alert('Error', 'Payment already processed. Please try again.');
          navigation.goBack();
          return;
        }
        
        setPaymentIntent({
          clientSecret,
          paymentIntentId,
          status
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
          setInitError('Unable to setup payment. Please try again.');
        }
      } else {
        console.error('Payment intent creation failed:', response);
        setInitError(response.message || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Initialize payment error:', error);
      setInitError('Failed to initialize payment. Please try again.');
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
        // Payment successful - create order and confirm with backend
        if (paymentIntent?.paymentIntentId) {
          try {
            // First confirm the payment with backend
            const confirmResult = await confirmPayment(token, paymentIntent.paymentIntentId);
            console.log('Payment confirmed:', confirmResult);
            
            // Create the actual order with payment reference
            const orderData = formatOrderData(
              items.map(item => ({
                product: {
                  _id: item.productId,
                  title: item.productName,
                  price: item.price
                },
                qty: item.quantity,
                size: item.size
              })),
              shippingAddress,
              `Payment ID: ${paymentIntent.paymentIntentId}`
            );
            
            console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
            
            const orderResult = await dispatch(createOrderAsync(orderData));
            
            console.log('Order creation result:', {
              fulfilled: createOrderAsync.fulfilled.match(orderResult),
              rejected: createOrderAsync.rejected.match(orderResult),
              payload: orderResult.payload,
              error: orderResult.error
            });
            
            if (createOrderAsync.fulfilled.match(orderResult)) {
              const order = orderResult.payload;
              console.log('Order created successfully:', order);
              
              dispatch(showToast({
                message: `Payment successful! Order #${order.orderNumber || order._id} confirmed.`,
                type: 'success'
              }));

              // Navigate to orders list
              navigation.reset({
                index: 0,
                routes: [{ name: 'MyOrders' }],
              });
            } else {
              console.error('Order creation failed via Redux, trying direct service call:', {
                payload: orderResult.payload,
                error: orderResult.error,
                meta: orderResult.meta
              });
              
              // Try direct service call as fallback
              try {
                const { createOrder } = await import('../services/orderService');
                const directOrder = await createOrder(orderData);
                console.log('Order created successfully via direct service call:', directOrder);
                
                dispatch(showToast({
                  message: `Payment successful! Order #${directOrder.orderNumber || directOrder._id} confirmed.`,
                  type: 'success'
                }));

                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MyOrders' }],
                });
                return; // Exit early since we succeeded
              } catch (directError) {
                console.error('Direct service call also failed:', directError);
              }
              
              const errorMessage = typeof orderResult.payload === 'string' 
                ? orderResult.payload 
                : orderResult.payload?.message || 'Failed to create order';
              
              throw new Error(errorMessage);
            }
          } catch (confirmError) {
            console.error('Payment confirmation or order creation error:', confirmError);
            dispatch(showToast({
              message: 'Payment processed but order creation failed. Please contact support with payment ID: ' + paymentIntent.paymentIntentId,
              type: 'warning'
            }));
            // Don't navigate away, let user try again or contact support
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

  if (initError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Payment</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.primary} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>Payment Setup Failed</Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>{initError}</Text>
          
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={retryPayment}
          >
            <Text style={styles.retryButtonText}>Retry Payment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
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
                  {item.size && <Text style={[styles.itemSize, { color: theme.textSecondary }]}> (Size: {item.size})</Text>}
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
  itemSize: {
    fontSize: 12,
    fontWeight: '400',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 200,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
