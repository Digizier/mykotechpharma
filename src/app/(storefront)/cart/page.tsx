'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Tag, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    finalTotal,
    shippingFee,
    discountAmount,
    couponCode,
    applyCoupon,
    removeCoupon,
    freeShippingProgress,
    freeShippingNeeded,
    hasPrescriptionItem,
    settings,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; error: boolean } | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const ok = applyCoupon(inputCoupon);
    if (ok) {
      setCouponMsg({ text: 'Coupon applied successfully!', error: false });
      setInputCoupon('');
    } else {
      setCouponMsg({ text: 'Invalid coupon code or minimum spend requirement not met.', error: true });
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-3 py-10 sm:py-20 text-center space-y-4 sm:space-y-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Your Cart is Empty</h1>
        <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
          You haven't added any medicines or health products to your basket yet.
        </p>
        <Link
          href="/products/"
          className="inline-flex items-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all"
        >
          <span>Explore Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8 w-full max-w-full overflow-x-hidden">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900">Shopping Cart</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">Review your medicines before proceeding to checkout</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
        
        {/* Left: Items List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Free Shipping Alert Box */}
          <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5 text-blue-700">
                <Sparkles className="w-4 h-4 text-blue-600" />
                {freeShippingNeeded === 0
                  ? 'Congratulations! You qualify for Free Home Delivery.'
                  : `Add Rs. ${freeShippingNeeded} more for Free Delivery!`}
              </span>
              <span>{freeShippingProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-blue-200/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Rx Warning */}
          {hasPrescriptionItem && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                Your order contains prescription medications. A valid doctor's prescription will be requested during delivery confirmation.
              </span>
            </div>
          )}

          {/* Table of items */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {cart.map((item) => (
              <div key={item.product.id} className="p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 p-2 shrink-0 flex items-center justify-center">
                  <img src={item.product.thumbnail_url || '/logo.png'} alt={item.product.name} className="w-full h-full object-contain" />
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <span className="text-[11px] font-bold text-blue-600 block">{item.product.dosage || 'Pack'}</span>
                  <Link href={`/products/${item.product.slug}/`} className="font-extrabold text-slate-900 text-base hover:text-blue-600 transition-colors">
                    {item.product.name}
                  </Link>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Unit Price: <span className="font-bold text-slate-800">Rs. {Number(item.product.price).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Stepper */}
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-0.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[80px]">
                    <div className="font-black text-slate-950 text-base">
                      Rs. {(Number(item.product.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-400 hover:text-red-500 p-1.5 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Summary Box */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
              Order Summary
            </h3>

            {/* Promo Code Form */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Promo / Discount Code</label>
              {couponCode ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    {couponCode} (-Rs. {discountAmount})
                  </span>
                  <button onClick={removeCoupon} className="text-red-500 hover:text-red-700 text-[11px]">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. SAVE100"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                  <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs">
                    Apply
                  </button>
                </form>
              )}
              {couponMsg && (
                <p className={`text-[11px] font-semibold ${couponMsg.error ? 'text-red-600' : 'text-emerald-600'}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">Rs. {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-blue-700 font-semibold">
                  <span>Discount</span>
                  <span>-Rs. {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="font-bold text-slate-900">
                  {shippingFee === 0 ? <span className="text-blue-700">FREE</span> : `Rs. ${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-lg font-black text-slate-950 pt-3 border-t border-slate-200">
                <span>Grand Total</span>
                <span>Rs. {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Link */}
            <Link
              href="/checkout/"
              className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-700/25 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs text-slate-500 space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Safe & Sealed Delivery</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Every package is dispatched in sealed, tamper-evident temperature controlled bags by MykoTech Pharma Pvt Ltd.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
