/**
 * Root stack - MainTabs, Login, SignUp, Wishlist, Cart, PlaceOrder
 * @format
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import WishlistScreen from '../screens/WishlistScreen';
import CartScreen from '../screens/CartScreen';
import PlaceOrderScreen from '../screens/PlaceOrderScreen';
import SellerProfileScreen from '../screens/SellerProfileScreen';
import SellerMessageScreen from '../screens/SellerMessageScreen';
import MessageScreen from '../screens/MessageScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MyPersonalDetailsScreen from '../screens/MyPersonalDetailsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import AdminPrimaryBannerScreen from '../screens/AdminPrimaryBannerScreen';
import AdminSecondaryBannerScreen from '../screens/AdminSecondaryBannerScreen';
import AdminCategoriesScreen from '../screens/AdminCategoriesScreen';
import AllSellersScreen from '../screens/AllSellersScreen';
import AllBuyersScreen from '../screens/AllBuyersScreen';
import SizeChartsScreen from '../screens/SizeChartsScreen';
import SizeChartFormScreen from '../screens/SizeChartFormScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import AllOrdersScreen from '../screens/AllOrdersScreen';
import SellerOrdersScreen from '../screens/SellerOrdersScreen';
import SellerPurchasesScreen from '../screens/SellerPurchasesScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import AlertScreen from '../screens/AlertScreen';
import PaymentScreen from '../screens/PaymentScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="MainTabs"
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="PlaceOrder" component={PlaceOrderScreen} />
      <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
      <Stack.Screen name="SellerMessage" component={SellerMessageScreen} />
      <Stack.Screen name="Messages" component={MessageScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MyPersonalDetails" component={MyPersonalDetailsScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
      <Stack.Screen name="AdminPrimaryBanner" component={AdminPrimaryBannerScreen} />
      <Stack.Screen name="AdminSecondaryBanner" component={AdminSecondaryBannerScreen} />
      <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} />
      <Stack.Screen name="AllSellers" component={AllSellersScreen} />
      <Stack.Screen name="AllBuyers" component={AllBuyersScreen} />
      <Stack.Screen name="SizeCharts" component={SizeChartsScreen} />
      <Stack.Screen name="SizeChartForm" component={SizeChartFormScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="AllOrders" component={AllOrdersScreen} />
      <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
      <Stack.Screen name="SellerPurchases" component={SellerPurchasesScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="Alerts" component={AlertScreen} />
    </Stack.Navigator>
  );
}
