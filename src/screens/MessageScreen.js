/**
 * Message screen - well-designed customer chats list
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useSelector } from 'react-redux';
import { getConversations } from '../services/messageService';

function ChatItem({ item, theme, navigation, currentUser }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if current user is the seller in this conversation
  const isCurrentUserSeller = currentUser && item.seller.id === currentUser._id;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.text,
        },
      ]}
      onPress={() => navigation.navigate('SellerMessage', { 
        seller: { 
          id: item.seller.id, 
          name: item.seller.name, 
          image: item.seller.avatar 
        } 
      })}
    >
      {item.seller.avatar ? (
        <Image source={{ uri: item.seller.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={[styles.avatarText, { color: '#fff' }]}>
            {item.seller.name ? item.seller.name.charAt(0).toUpperCase() : 'S'}
          </Text>
        </View>
      )}
      <View style={styles.chatContent}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {item.seller.name}
            {isCurrentUserSeller && (
              <Text style={[styles.youIndicator, { color: theme.textSecondary }]}> (YOU)</Text>
            )}
          </Text>
          <Text style={[styles.time, { color: theme.muted }]}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text
          style={[styles.lastMessage, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {item.lastMessage}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.muted}
        style={styles.chevron}
      />
      {item.unreadCount > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: theme.primary.trim() }]}>
          <Text style={styles.unreadCount}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MessageScreen({ navigation, route }) {
  const theme = useTheme();
  const token = useSelector((state) => state.auth.token);
  const currentUser = useSelector((state) => state.auth.user);
  
  // Check if we're coming from a specific seller
  const specificSeller = route?.params?.seller;
  
  // Add refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // If we have a specific seller, navigate directly to chat
  useEffect(() => {
    if (specificSeller) {
      navigation.replace('SellerMessage', { seller: specificSeller });
    }
  }, [specificSeller, navigation]);

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);

  const loadConversations = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Load actual conversations from API
      const conversationList = await getConversations(token);
      setConversations(conversationList);
      setFilteredConversations(conversationList);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!specificSeller) {
      loadConversations();
    }
  }, [token, refreshKey]);

  // Refresh conversations when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!specificSeller) {
        setRefreshKey(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, [navigation, specificSeller]);

  // Filter conversations based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conversation => 
        conversation.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.seller?.shopName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Messages</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Chats with sellers</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary.trim()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
      edges={['top']}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {specificSeller ? specificSeller.name : 'Messages'}
        </Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
          {specificSeller ? 'Chat with this seller' : 'Chats with sellers'}
        </Text>
      </View>
      
      {/* Search Bar */}
      {!specificSeller && (
        <View style={[styles.searchContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search conversations..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatItem item={item} theme={theme} navigation={navigation} currentUser={currentUser} />}
        contentContainerStyle={styles.list}
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery.trim() === '' 
                ? 'No conversations yet. Message sellers from product pages to start chatting!'
                : 'No conversations found matching your search.'
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  listContainer: { flex: 1 },
  list: { padding: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  avatarPlaceholder: {
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  chatContent: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: { fontSize: 16, fontWeight: '600' },
  youIndicator: { fontSize: 14, fontWeight: '400' },
  time: { fontSize: 12 },
  lastMessage: { fontSize: 14, lineHeight: 20 },
  chevron: { marginLeft: 8 },
  unreadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '600' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
