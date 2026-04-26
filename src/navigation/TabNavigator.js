/**
 * Bottom tab navigator - Home, Messages, AI, Profile
 * @format
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { selectUnreadAlertCount, selectAllAlerts } from '../store/slices/alertSlice';
import { getConversations } from '../services/messageService';
import HomeScreen from '../screens/HomeScreen';
import MessageScreen from '../screens/MessageScreen';
import AIChatScreen from '../screens/AIChatScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// Badge component for tab icons (moved outside to avoid hook ordering issues)
const TabBadge = ({ count, theme, focused }) => {
  if (count <= 0) return null;
  return (
    <View style={{
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: focused ? '#fff' : '#D4AF37',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      zIndex: 1,
    }}>
      <Text style={{
        color: theme.primary?.trim?.() || theme.primary,
        fontSize: 11,
        fontWeight: '600',
      }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

export default function TabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const token = useSelector(state => state.auth.token);
  
  // Get alert counts (if you still want them for other purposes)
  const unreadAlertCount = useSelector(selectUnreadAlertCount);
  const allAlerts = useSelector(selectAllAlerts);
  
  // Calculate alert count (same logic as Header)
  const calculatedUnreadCount = unreadAlertCount > 0 ? unreadAlertCount : allAlerts.filter(alert => !alert.read).length;

  // Fetch conversations to get unread chat count
  useEffect(() => {
    const fetchUnreadChatCount = async () => {
      if (!token) return;
      
      try {
        const conversations = await getConversations(token);
        if (Array.isArray(conversations)) {
          const totalUnread = conversations.reduce((sum, conversation) => {
            return sum + (conversation.unreadCount || 0);
          }, 0);
          setUnreadChatCount(totalUnread);
        }
      } catch (error) {
        console.error('Failed to fetch conversations for unread count:', error);
      }
    };

    fetchUnreadChatCount();
    
    // Poll every 30 seconds for new messages
    const interval = setInterval(fetchUnreadChatCount, 30000);
    
    return () => clearInterval(interval);
  }, [token]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D4AF37', // Yellow for active tabs
        tabBarInactiveTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: theme.primary?.trim?.() || theme.primary,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 56 + Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
    
      
        <Tab.Screen
        name="Messages"
        component={MessageScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ position: 'relative', width: size ?? 24, height: size ?? 24 }}>
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={size ?? 24}
                color={color}
              />
              <TabBadge count={unreadChatCount} theme={theme} focused={focused} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="AI"
        component={AIChatScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'cube' : 'cube-outline'}
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
