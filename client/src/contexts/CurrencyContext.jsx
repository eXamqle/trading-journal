import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { authAPI } from '../api/auth';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [currency, setCurrencyState] = useState('USD');

  // Load currency from user when user changes
  useEffect(() => {
    if (user?.currency) {
      setCurrencyState(user.currency);
    }
  }, [user]);

  const setCurrency = async (newCurrency) => {
    try {
      // Update state immediately for better UX
      setCurrencyState(newCurrency);

      // Save to backend
      const { data } = await authAPI.updateCurrency(newCurrency);

      // Update user in AuthContext with the returned user data
      if (updateUser && data) {
        updateUser(data);
      }
    } catch (error) {
      console.error('Failed to update currency:', error);
      // Revert on error
      if (user?.currency) {
        setCurrencyState(user.currency);
      }
    }
  };

  const getCurrencySymbol = () => {
    return currency === 'EUR' ? '€' : '$';
  };

  const value = {
    currency,
    setCurrency,
    symbol: getCurrencySymbol()
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
