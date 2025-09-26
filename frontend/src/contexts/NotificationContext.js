import React, { createContext, useState, useCallback, useContext } from 'react';
import Notification from '../components/common/Notification';

// Fournir une valeur par défaut qui correspond à la forme de l'objet du contexte
export const NotificationContext = createContext({
  showNotification: () => {}, // Fonction vide par défaut pour éviter les erreurs
});

// Hook pour utiliser le contexte de notification
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({ message: '', type: '' });

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  const closeNotification = () => {
    setNotification({ message: '', type: '' });
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
      {children}
    </NotificationContext.Provider>
  );
};
