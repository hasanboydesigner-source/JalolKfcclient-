import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://jalolkfc.onrender.com';

export const useSocket = (onNewOrder, onStatusUpdate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    // New order listener
    socketRef.current.on('newOrder', (order) => {
      if (onNewOrder) onNewOrder(order);
    });

    // Status update listener
    socketRef.current.on('orderStatusUpdated', (order) => {
      if (onStatusUpdate) onStatusUpdate(order);
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [onNewOrder, onStatusUpdate]);

  return socketRef.current;
};
