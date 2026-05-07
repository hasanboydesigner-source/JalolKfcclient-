import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';

export const useSocket = (onNewOrder, onStatusUpdate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL);

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
