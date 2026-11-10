import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

export const useSocket = (onNewOrder, onStatusUpdate, onSettingsUpdate, onTableUpdate) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // Keep references to latest callbacks so socket doesn't reconnect when callbacks change
  const callbacksRef = useRef({ onNewOrder, onStatusUpdate, onSettingsUpdate, onTableUpdate });
  useEffect(() => {
    callbacksRef.current = { onNewOrder, onStatusUpdate, onSettingsUpdate, onTableUpdate };
  });

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socket.on('newOrder', (order) => {
      callbacksRef.current.onNewOrder?.(order);
    });

    socket.on('orderStatusUpdated', (order) => {
      callbacksRef.current.onStatusUpdate?.(order);
    });

    socket.on('settingsUpdated', (settings) => {
      callbacksRef.current.onSettingsUpdate?.(settings);
    });

    socket.on('tableUpdated', (table) => {
      callbacksRef.current.onTableUpdate?.(table);
    });

    socket.on('tablesRefreshed', () => {
      callbacksRef.current.onTableUpdate?.(null);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current) socketRef.current.emit(event, data);
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return {
    connected: isConnected,
    isConnected,
    emit,
    on,
    off
  };
};
