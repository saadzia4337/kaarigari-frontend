/**
 * AI Chat tab - chatbot UI: message list, input, send
 * @format
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { sendAIMessage, sendAIMessageWithImage, generateFashionImage, getSuggestedQuestions } from '../services/aiChatService';
import { showToast } from '../store/slices/toastSlice';
import { launchImageLibrary } from 'react-native-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INITIAL_MESSAGES = [
  { id: '0', text: "Hi! I'm your Kaarigari AI fashion consultant. Ask me about tailoring, designs, colors, fabrics, or style advice!", fromMe: false, time: 'Now' },
];

export default function AIChatScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions] = useState(getSuggestedQuestions());
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [showImageGenModal, setShowImageGenModal] = useState(false);
  const [imageGenPrompt, setImageGenPrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const listRef = useRef(null);

  const send = async () => {
    const t = input.trim();
    if (!t && !selectedImage) return;
    
    if (!isAuthenticated || !token) {
      Alert.alert('Login Required', 'Please login to use the AI assistant.');
      return;
    }
    
    const userMsg = {
      id: Date.now().toString(),
      text: t || (selectedImage ? '[Image sent]' : ''),
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: selectedImage,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);
    
    try {
      let response;
      if (currentImage) {
        response = await sendAIMessageWithImage(token, t, currentImage);
      } else {
        response = await sendAIMessage(token, t);
      }
      
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        fromMe: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('AI Chat error:', error);
      let errorMessage = "Sorry, I'm having trouble responding right now. Please try again later.";
      
      // Handle specific OpenAI configuration errors
      if (error.userMessage?.includes('AI service is not configured')) {
        errorMessage = "AI service is not available at the moment. Please contact support for assistance.";
      }
      
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        fromMe: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      dispatch(showToast({ message: error.userMessage || 'Failed to get AI response', type: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 800,
      maxWidth: 600,
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorCode) {
        return;
      }

      if (response.assets && response.assets[0]) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const generateImage = async () => {
    const prompt = imageGenPrompt.trim();
    if (!prompt) {
      Alert.alert('Prompt Required', 'Please enter a description for the image you want to generate.');
      return;
    }

    if (!isAuthenticated || !token) {
      Alert.alert('Login Required', 'Please login to use image generation.');
      return;
    }

    setIsGeneratingImage(true);
    
    try {
      const result = await generateFashionImage(token, prompt);
      
      // Add user message
      const userMsg = {
        id: Date.now().toString(),
        text: `Generate image: ${prompt}`,
        fromMe: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      // Add AI message with generated image
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: `I've generated a fashion image based on your request: "${prompt}"`,
        fromMe: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generatedImage: result.imageUrl,
        imagePrompt: prompt,
      };
      
      setMessages(prev => [...prev, userMsg, aiMsg]);
      setShowImageGenModal(false);
      setImageGenPrompt('');
      
    } catch (error) {
      console.error('Image generation error:', error);
      dispatch(showToast({ 
        message: error.userMessage || 'Failed to generate image', 
        type: 'error' 
      }));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const copyMessage = async (message) => {
    try {
      // Use Share API which includes copy to clipboard option
      await Share.share({
        message: message.text,
        title: 'AI Fashion Advice',
      });
    } catch (error) {
      // User cancelled the share dialog
      console.log('Share cancelled');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#fff' }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.primary?.trim?.() || theme.primary, borderBottomColor: theme.border }]}>
        <View style={[styles.botBadge, { backgroundColor: theme.yellow }]}>
          <Ionicons name="sparkles" size={20} color="#000" />
        </View>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>AI Assistant</Text>
        <Text style={[styles.headerSub, { color: '#fff' }]}>Ask about tailors & orders</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.bubbleWrap, item.fromMe ? styles.bubbleRight : styles.bubbleLeft]}>
              <TouchableOpacity
                style={[
                  styles.bubble,
                  { backgroundColor: item.fromMe ? theme.primary.trim() : theme.backgroundSecondary },
                ]}
                onLongPress={() => item.text && copyMessage(item)}
                delayLongPress={300}
              >
                {item.image && (
                  <TouchableOpacity onPress={() => { setSelectedImage(item.image); setImageModalVisible(true); }}>
                    <Image source={{ uri: item.image.uri }} style={styles.messageImage} />
                  </TouchableOpacity>
                )}
                {item.generatedImage && (
                  <TouchableOpacity onPress={() => { setSelectedImage({ uri: item.generatedImage }); setImageModalVisible(true); }}>
                    <Image source={{ uri: item.generatedImage }} style={styles.messageImage} />
                    <Text style={[styles.generatedImageLabel, { color: item.fromMe ? '#fff' : theme.textSecondary }]}>
                      🎨 Generated: {item.imagePrompt}
                    </Text>
                  </TouchableOpacity>
                )}
                {item.text && (
                  <Text style={[styles.bubbleText, { color: item.fromMe ? '#fff' : theme.text }]}>
                    {item.text}
                  </Text>
                )}
                <Text
                  style={[styles.bubbleTime, { color: item.fromMe ? 'rgba(255,255,255,0.8)' : theme.muted }]}
                >
                  {item.time}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
        
        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <View style={[styles.suggestionsContainer, { borderTopColor: theme.border }]}>
            <Text style={[styles.suggestionsTitle, { color: theme.text }]}>Suggested questions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
              {suggestedQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionChip, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                  onPress={() => setInput(question)}
                >
                  <Text style={[styles.suggestionText, { color: theme.text }]}>{question}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Selected Image Preview */}
        {selectedImage && (
          <View style={[styles.selectedImageContainer, { borderTopColor: theme.border }]}>
            <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={[styles.inputRow, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <TouchableOpacity
            style={[styles.cameraBtn, { borderColor: theme.border }]}
            onPress={pickImage}
          >
            <Ionicons name="camera-outline" size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cameraBtn, { borderColor: theme.border }]}
            onPress={() => setShowImageGenModal(true)}
          >
            <Ionicons name="image-outline" size={20} color={theme.text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Ask anything, send an image, or generate designs..."
            placeholderTextColor={theme.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: theme.primary.trim() }]}
            onPress={send}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* Image Generation Modal */}
      <Modal
        visible={showImageGenModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageGenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.imageGenModal, { backgroundColor: theme.background }]}>
            <View style={[styles.imageGenHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.imageGenTitle, { color: theme.text }]}>Generate Fashion Image</Text>
              <TouchableOpacity onPress={() => setShowImageGenModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[
                styles.imageGenInput,
                { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }
              ]}
              placeholder="Describe the fashion design you want to generate..."
              placeholderTextColor={theme.muted}
              value={imageGenPrompt}
              onChangeText={setImageGenPrompt}
              multiline
              maxLength={1000}
            />
            
            <Text style={[styles.charCount, { color: theme.textSecondary }]}>
              {imageGenPrompt.length}/1000
            </Text>
            
            <View style={styles.imageGenExamples}>
              <Text style={[styles.examplesTitle, { color: theme.text }]}>Examples:</Text>
              <TouchableOpacity 
                style={[styles.exampleChip, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                onPress={() => setImageGenPrompt('Modern elegant evening dress with floral patterns')}
              >
                <Text style={[styles.exampleText, { color: theme.text }]}>Modern evening dress</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.exampleChip, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                onPress={() => setImageGenPrompt('Traditional wedding outfit with intricate embroidery')}
              >
                <Text style={[styles.exampleText, { color: theme.text }]}>Traditional wedding wear</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.exampleChip, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                onPress={() => setImageGenPrompt('Casual summer dress with pastel colors')}
              >
                <Text style={[styles.exampleText, { color: theme.text }]}>Casual summer dress</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: theme.primary.trim() }]}
              onPress={generateImage}
              disabled={isGeneratingImage || !imageGenPrompt.trim()}
            >
              {isGeneratingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.generateBtnText}>Generate Image</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Image Preview Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            activeOpacity={1}
            onPress={() => setImageModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedImage?.uri }} style={styles.modalImage} />
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setImageModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  botBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  headerSub: { fontSize: 12 },
  list: { padding: 16, paddingBottom: 12 },
  bubbleWrap: { marginBottom: 12 },
  bubbleLeft: { alignItems: 'flex-start' },
  bubbleRight: { alignItems: 'flex-end' },
  bubble: { maxWidth: '82%', padding: 12, borderRadius: 16 },
  bubbleText: { fontSize: 15 },
  bubbleTime: { fontSize: 11, marginTop: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionsScroll: {
    flexDirection: 'row',
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 13,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    position: 'relative',
  },
  modalImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
    borderRadius: 8,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatedImageLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  imageGenModal: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  imageGenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  imageGenTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  imageGenInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 16,
  },
  imageGenExamples: {
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  exampleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 13,
  },
  generateBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
