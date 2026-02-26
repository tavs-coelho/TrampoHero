import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../../contexts/AuthContext';
import { createChatClient } from '../../services/chat';
import type { Message } from '../../api/types';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route }: Props) {
  const { jobId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const chatRef = useRef<ReturnType<typeof createChatClient> | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const client = createChatClient(jobId, (msg: Message) => {
          if (mounted) {
            setMessages(prev => [...prev, msg]);
          }
        });
        chatRef.current = client;
        await client.connect();
      } catch {
        Alert.alert('Chat', 'Não foi possível conectar ao chat agora.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      chatRef.current?.disconnect();
    };
  }, [jobId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !chatRef.current) return;
    setInput('');
    await chatRef.current.sendMessage(text);
  }, [input]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isOwn = item.senderId === user?.id;
      return (
        <View
          style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}
        >
          {!isOwn && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, isOwn && styles.ownTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      );
    },
    [user?.id],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a1a2e" />
        <Text style={styles.loadingText}>Conectando ao chat…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <Text style={styles.emptyChat}>
            Nenhuma mensagem ainda. Diga olá! 👋
          </Text>
        }
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Digite uma mensagem…"
          placeholderTextColor="#999"
          value={input}
          onChangeText={setInput}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyChat: {
    textAlign: 'center',
    color: '#888',
    marginTop: 48,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  ownBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1a1a2e',
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  senderName: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    color: '#333',
  },
  ownMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownTimestamp: {
    color: '#ccc',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
