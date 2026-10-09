'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Product, StoreSettings } from '@/types';
import { getStoreSettings } from '@/lib/db';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, openDrawer?: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  hasPrescriptionItem: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  couponCode: string;
  discountAmount: number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  shippingFee: number;
  finalTotal: number;
  freeShippingProgress: number;
  freeShippingNeeded: number;
  settings: StoreSettings;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [settings, setSettings] = useState<StoreSettings>(getStoreSettings());

  // Listen to dynamic store settings changes
  useEffect(() => {
    const handleSettingsUpdate = () => {
      setSettings(getStoreSettings());
    };
    window.addEventListener('myko_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('myko_settings_updated', handleSettingsUpdate);
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('mykotech_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
      const savedCoupon = localStorage.getItem('mykotech_coupon');
      if (savedCoupon) {
        const parsed = JSON.parse(savedCoupon);
        setCouponCode(parsed.code || '');
        setDiscountAmount(parsed.discount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('mykotech_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('myko_cart_updated'));
    }
  }, [cart, isLoaded]);

  const addToCart = (product: Product, quantity: number = 1, openDrawer: boolean = true) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode('');
    setDiscountAmount(0);
    localStorage.removeItem('mykotech_coupon');
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const applyCoupon = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'SAVE100' && subtotal >= 1000) {
      setCouponCode(clean);
      setDiscountAmount(100);
      localStorage.setItem('mykotech_coupon', JSON.stringify({ code: clean, discount: 100 }));
      return true;
    } else if (clean === 'FREESHIP' || clean === 'MYKO10') {
      const disc = clean === 'MYKO10' ? Math.round(subtotal * 0.1) : settings.base_shipping_fee;
      setCouponCode(clean);
      setDiscountAmount(disc);
      localStorage.setItem('mykotech_coupon', JSON.stringify({ code: clean, discount: disc }));
      return true;
    }
    return false;
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscountAmount(0);
    localStorage.removeItem('mykotech_coupon');
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  const hasPrescriptionItem = cart.some((item) => item.product.requires_prescription);

  // Free shipping progress
  const isFreeShipping = subtotal >= settings.free_shipping_threshold || couponCode === 'FREESHIP';
  const shippingFee = subtotal === 0 ? 0 : isFreeShipping ? 0 : settings.base_shipping_fee;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const freeShippingProgress = Math.min(100, Math.round((subtotal / settings.free_shipping_threshold) * 100));
  const freeShippingNeeded = Math.max(0, settings.free_shipping_threshold - subtotal);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        hasPrescriptionItem,
        isCartOpen,
        openCart,
        closeCart,
        couponCode,
        discountAmount,
        applyCoupon,
        removeCoupon,
        shippingFee,
        finalTotal,
        freeShippingProgress,
        freeShippingNeeded,
        settings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
