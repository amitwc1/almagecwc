import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext) || {};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const newSocket = io(socketUrl, { withCredentials: true });
      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('user_online', user.id);
      });

      newSocket.on('user_status', ({ userId, online }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          if (online) next.add(userId);
          else next.delete(userId);
          return next;
        });
      });

      return () => {
        newSocket.close();
        socketRef.current = null;
      };
    }
  }, [user]);

  const isOnline = (userId) => onlineUsers.has(userId);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isOnline }}>
      {children}
    </SocketContext.Provider>
  );
};
