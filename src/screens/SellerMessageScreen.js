/**
 * Message screen for a single seller - dynamic chat thread
 * @format
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useSelector } from 'react-redux';
import { getMessages, sendMessage, deleteMessage, deleteMessages, markMessagesAsRead } from '../services/messageService';
import { 
  initializeSocket, 
  getSocket, 
  setupSocketListeners, 
  joinUserRoom, 
  sendMessageViaSocket, 
  startTyping, 
  stopTyping, 
  markMessageAsRead,
  disconnectSocket 
} from '../services/socketService';

export default function SellerMessageScreen({ navigation, route }) {
  const theme = useTheme();
  const seller = route?.params?.seller || { name: 'Seller', id: null };
  // Ensure seller has avatar field (handle both avatar and image field names)
  if (seller.image && !seller.avatar) {
    seller.avatar = seller.image;
  }
  const token = useSelector((state) => state.auth.token);
  const currentUser = useSelector((state) => state.auth.user);
  
  // Function to get user ID with fallbacks
  const getUserId = () => {
    if (currentUserId) return currentUserId;
    if (currentUser?._id) return currentUser._id; // Fix: use _id instead of id
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          return payload.id;
        }
      } catch (error) {
        console.error('Failed to extract user ID from token:', error);
      }
    }
    return null;
  };
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  // Initialize socket and load messages when component mounts
  useEffect(() => {
    if (token && seller.id && currentUser) {
      console.log('=== MESSAGE FLOW DEBUG ===');
      console.log('Full Redux User Object:', currentUser);
      console.log('Current User ID:', currentUser._id);
      console.log('Current User Email:', currentUser.email);
      console.log('Current User Role:', currentUser.role);
      console.log('Seller ID:', seller.id);
      console.log('Seller Name:', seller.name);
      console.log('Token exists:', !!token);
      
      // Set current user ID for message display
      if (currentUser._id) {
        setCurrentUserId(currentUser._id);
        console.log('Set currentUserId to:', currentUser._id);
      } else {
        console.error('currentUser._id is undefined!');
        // Try to get user ID from token as fallback
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('User ID from token:', payload.id);
            setCurrentUserId(payload.id);
          }
        } catch (error) {
          console.error('Failed to extract user ID from token:', error);
        }
      }
      
      // Initialize Socket.IO connection with current user ID
      initializeSocket(token, currentUser._id);
      
      // Join current user room
      joinUserRoom(currentUser._id);
      
      // Set up socket listeners
      setupSocketListeners({
        onMessageReceived: (message) => {
          console.log('=== MESSAGE RECEIVED EVENT ===');
          console.log('Current User ID:', currentUser._id);
          console.log('Current User Email:', currentUser.email);
          console.log('Message ID:', message.id);
          console.log('Message Content:', message.content);
          console.log('Sender ID:', message.sender?._id);
          console.log('Sender Name:', message.sender?.firstName + ' ' + message.sender?.lastName);
          console.log('Receiver ID:', message.receiver?._id);
          console.log('Receiver Name:', message.receiver?.firstName + ' ' + message.receiver?.lastName);
          console.log('Is from current user:', message.sender?._id === currentUser._id);
          console.log('Should add to messages:', message.sender?._id !== currentUser._id);
          
          setMessages(prev => {
            // Check if message already exists
            const exists = prev.some(msg => msg.id === message.id);
            if (!exists) {
              console.log('Adding message to chat:', message.content);
              return [...prev, message];
            } else {
              console.log('Message already exists, skipping');
              return prev;
            }
          });
          console.log('========================');
        },
        onMessageSent: (message) => {
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === message.id);
            if (!exists) {
              return [...prev, message];
            }
            return prev;
          });
        },
        onMessageRead: (data) => {
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId ? { ...msg, read: true, readAt: data.readAt } : msg
          ));
        },
        onUserOnline: (data) => {
          console.log('User online:', data.userId);
        },
        onUserOffline: (data) => {
          console.log('User offline:', data.userId);
        },
        onUserTyping: (data) => {
          console.log('User typing:', data);
        },
        onError: (error) => {
          console.error('Socket error:', error);
        }
      });
      
      // Load initial messages
      loadMessages();
    }
    
    return () => {
      disconnectSocket();
    };
  }, [token, seller.id]);

  const loadMessages = async () => {
    if (!seller.id || !token) return;
    
    try {
      setLoading(true);
      const messageList = await getMessages(token, seller.id);
      setMessages(messageList);
      
      // Mark messages as read when opening conversation
      try {
        await markMessagesAsRead(token, seller.id);
        console.log('Messages marked as read for seller:', seller.id);
      } catch (readError) {
        console.warn('Failed to mark messages as read:', readError);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !seller.id || !token || sending) return;

    console.log('=== SENDING MESSAGE ===');
    console.log('Current User ID:', currentUser._id);
    console.log('Current User Role:', currentUser.role);
    console.log('Seller ID:', seller.id);
    console.log('Message Content:', inputText.trim());
    console.log('Sending to seller:', seller.id);

    try {
      setSending(true);
      
      // Send message via API only - backend will handle socket emission
      const newMessage = await sendMessage(token, seller.id, inputText.trim());
      
      console.log('Message sent successfully:', newMessage);
      
      // Add message to local state
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }, [inputText, seller.id, token, sending, currentUser]);

  // Filter messages based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(message => 
        (message.text || message.content || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [searchQuery, messages]);

  // Handle long press on message
  const handleLongPress = (message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };

  // Toggle message selection in delete mode
  const toggleMessageSelection = (messageId) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  // Delete single message
  const handleDeleteMessage = async (messageId) => {
    try {
      // Call API to delete message
      await deleteMessage(token, messageId);
      
      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setFilteredMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      console.log('Message deleted permanently:', messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      // Show error to user
      alert('Failed to delete message. Please try again.');
    }
  };

  // Delete selected messages in bulk
  const handleDeleteSelectedMessages = async () => {
    try {
      const messageIds = Array.from(selectedMessages);
      
      // Call API to delete messages in bulk
      await deleteMessages(token, messageIds);
      
      // Remove from local state
      setMessages(prev => prev.filter(msg => !selectedMessages.has(msg.id)));
      setFilteredMessages(prev => prev.filter(msg => !selectedMessages.has(msg.id)));
      
      // Reset delete mode
      setDeleteMode(false);
      setSelectedMessages(new Set());
      
      console.log('Bulk delete completed permanently:', messageIds.length);
    } catch (error) {
      console.error('Failed to delete messages:', error);
      // Show error to user
      alert('Failed to delete messages. Please try again.');
    }
  };

  const renderMessage = ({ item }) => {
    // Get user ID with fallbacks
    const userId = getUserId();
    
    // Determine if this message is from current user or other user
    const isFromCurrentUser = item.sender?._id === userId;
    
    console.log('=== RENDER MESSAGE DEBUG ===');
    console.log('Current User ID (fallback):', userId);
    console.log('Original currentUserId:', currentUserId);
    console.log('Current User Email:', currentUser?.email);
    console.log('Current User Role:', currentUser?.role);
    console.log('Message ID:', item.id);
    console.log('Message Content:', item.text || item.content);
    console.log('Sender ID:', item.sender?._id);
    console.log('Sender Name:', item.sender?.firstName + ' ' + item.sender?.lastName);
    console.log('Receiver ID:', item.receiver?._id);
    console.log('Receiver Name:', item.receiver?.firstName + ' ' + item.receiver?.lastName);
    console.log('Is from current user:', isFromCurrentUser);
    console.log('Will show on:', isFromCurrentUser ? 'RIGHT (blue)' : 'LEFT (gray)');
    console.log('================================');
    
    // If we still don't have userId, show a warning but don't crash
    if (!userId) {
      console.warn('User ID is undefined - messages may not display correctly');
    }
    
    return (
      <View style={[styles.bubbleWrap, isFromCurrentUser ? styles.bubbleRight : styles.bubbleLeft]}>
        {/* User name above message */}
        <Text style={[styles.userName, { color: isFromCurrentUser ? theme.primary.trim() : theme.textSecondary }]}>
          {item.sender?.firstName + ' ' + item.sender?.lastName}
        </Text>
        
        {/* Message row with checkbox and bubble */}
        <View style={styles.messageRow}>
          {/* Delete mode checkbox on the left */}
          {deleteMode && !isFromCurrentUser && (
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => toggleMessageSelection(item.id)}
            >
              <View style={[
                styles.checkboxInner,
                { backgroundColor: selectedMessages.has(item.id) ? theme.primary.trim() : 'transparent' }
              ]}>
                {selectedMessages.has(item.id) && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.bubble, 
              { backgroundColor: isFromCurrentUser ? theme.primary.trim() : theme.backgroundSecondary }
            ]}
            onPress={() => deleteMode && toggleMessageSelection(item.id)}
            onLongPress={() => !deleteMode && handleLongPress(item)}
            delayLongPress={500}
          >
            <Text style={[styles.bubbleText, { color: isFromCurrentUser ? '#fff' : theme.text }]}>{item.text || item.content}</Text>
            <Text style={[styles.bubbleTime, { color: isFromCurrentUser ? 'rgba(255,255,255,0.8)' : theme.muted }]}>{item.time}</Text>
          </TouchableOpacity>
          
          {/* Delete mode checkbox on the right */}
          {deleteMode && isFromCurrentUser && (
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => toggleMessageSelection(item.id)}
            >
              <View style={[
                styles.checkboxInner,
                { backgroundColor: selectedMessages.has(item.id) ? theme.primary.trim() : 'transparent' }
              ]}>
                {selectedMessages.has(item.id) && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.primary.trim(), borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        {!deleteMode ? (
          <View style={styles.headerInfo}>
            {seller.avatar ? (
              <Image source={{ uri: seller.avatar }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
                <Text style={[styles.avatarText, { color: '#fff' }]}>
                  {seller.shopName ? seller.shopName.charAt(0).toUpperCase() : (seller.name ? seller.name.charAt(0).toUpperCase() : 'S')}
                </Text>
              </View>
            )}
            <View style={styles.headerTextInfo}>
              <Text style={[styles.headerTitle, { color: '#fff' }]} numberOfLines={1}>
                {seller.shopName || seller.name}
              </Text>
              <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>
                {seller.name || 'Seller'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: '#fff' }]} numberOfLines={1}>
              {selectedMessages.size} selected
            </Text>
            <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
              Tap messages to select
            </Text>
          </View>
        )}
        {deleteMode ? (
          <TouchableOpacity 
            onPress={() => {
              if (selectedMessages.size > 0) {
                handleDeleteSelectedMessages();
              } else {
                setDeleteMode(false);
                setSelectedMessages(new Set());
              }
            }} 
            style={styles.menuBtn}
          >
            <Ionicons 
              name={selectedMessages.size > 0 ? "trash" : "close"} 
              size={24} 
              color={selectedMessages.size > 0 ? "#ff4444" : "#fff"} 
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.menuBtn}>
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Input */}
      {searchMode && (
        <View style={[styles.searchContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search messages..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity onPress={() => {
            setSearchMode(false);
            setSearchQuery('');
          }}>
            <Ionicons name="close" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Options Menu */}
      {showMenu && (
        <View style={[styles.menuContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity 
            onPress={() => {
              setShowMenu(false);
              setSearchMode(true);
            }} 
            style={styles.menuItem}
          >
            <Ionicons name="search" size={20} color={theme.text} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: theme.text }]}>Search Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              setShowMenu(false);
              setDeleteMode(true);
            }} 
            style={styles.menuItem}
          >
            <Ionicons name="trash-outline" size={20} color={theme.text} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: theme.text }]}>Delete Messages</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Close menu overlay */}
      {showMenu && (
        <TouchableOpacity 
          style={styles.menuOverlay} 
          onPress={() => setShowMenu(false)}
        />
      )}

      {/* Delete Message Modal */}
      {showDeleteModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Delete Message</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              Are you sure you want to delete this message? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                onPress={() => {
                  setShowDeleteModal(false);
                  setMessageToDelete(null);
                }} 
                style={[styles.modalBtn, styles.modalCancel, { borderColor: theme.border }]}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  if (messageToDelete) {
                    handleDeleteMessage(messageToDelete.id);
                  }
                  setShowDeleteModal(false);
                  setMessageToDelete(null);
                }} 
                style={[styles.modalBtn, styles.modalDelete]}
              >
                <Text style={styles.modalBtnTextDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
      >
        <FlatList
          data={searchMode ? filteredMessages : messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No messages yet. Start a conversation!
                </Text>
              </View>
            )
          }
        />
        
        <View style={[styles.inputRow, { borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? theme.primary.trim() : theme.muted }]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexContainer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 8 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerTextInfo: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuBtn: { padding: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  menuContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    borderRadius: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuIcon: { marginRight: 12 },
  menuText: { fontSize: 16 },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  checkbox: {
    marginHorizontal: 8,
    alignSelf: 'flex-end',
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
    modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancel: {
    borderWidth: 1,
  },
  modalDelete: {
    backgroundColor: '#ff4444',
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalBtnTextDelete: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  list: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  bubbleWrap: { marginBottom: 12 },
  bubbleLeft: { alignItems: 'flex-start' },
  bubbleRight: { alignItems: 'flex-end' },
  userName: { fontSize: 12, fontWeight: '500', marginBottom: 4, paddingHorizontal: 8 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  bubbleText: { fontSize: 15 },
  bubbleTime: { fontSize: 11, marginTop: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, gap: 8 },
  input: { flex: 1, minHeight: 44, maxHeight: 100, borderRadius: 22, paddingHorizontal: 16, fontSize: 15, paddingTop: 10, paddingBottom: 10 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyText: { fontSize: 16, textAlign: 'center' },
});
