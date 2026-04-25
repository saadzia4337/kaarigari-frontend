/**
 * Kaarigari - UI only, dummy data
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { store } from './store';
import { rehydrateAuth } from './store/slices/authSlice';
import { fetchCartAsync } from './store/slices/cartSlice';
import { fetchWishlistAsync } from './store/slices/wishlistSlice';
import RootNavigator from './navigation/RootNavigator';
import Toast from './components/Toast';
import { StripeProvider } from '@stripe/stripe-react-native';

function AppContent() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const rehydrating = useSelector((state) => state.auth.rehydrating);
  
  // Use hardcoded Stripe key directly for now
  const stripePublishableKey = 'pk_test_51Q54FDC0jKdaSlvDMcaevIYbnOaJmp46S0aUDk3XhmBf3jGuDfP4eR6m2SkwT1DB9nNR248DcPRVUImmwjBOipjF006rceJc2a';

  useEffect(() => {
    dispatch(rehydrateAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!rehydrating && isAuthenticated) {
      dispatch(fetchCartAsync());
      dispatch(fetchWishlistAsync());
    }
  }, [rehydrating, isAuthenticated, dispatch]);

  return (
    <View style={styles.appWrap}>
      <StatusBar
        barStyle={theme.background === '#121212' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <StripeProvider publishableKey={stripePublishableKey}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <Toast />
      </StripeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  appWrap: { flex: 1 },
});

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <Provider store={store}>
          <AppContent />
        </Provider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
