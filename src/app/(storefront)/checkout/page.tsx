'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ChevronRight, 
  ShoppingBag,
  CreditCard,
  Building,
  Smartphone,
  MessageCircle,
  Truck
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, subtotal, finalTotal, shippingFee, discountAmount, couponCode, settings } = useCart();

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Islamabad');
  const [addressType, setAddressType] = useState<'home' | 'office'>('home');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'jazzcash' | 'easypaisa' | 'bank'>('cod');
  const [orderNotes, setOrderNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderCompleted, setOrderCompleted] = useState<{ orderNumber: string; total: number } | null>(null);

  if (cart.length === 0 && !orderCompleted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-900">Your Cart is Empty</h2>
        <p className="text-slate-500 text-sm">Please add medicines to your cart before proceeding to checkout.</p>
        <Link href="/products/" className="inline-block px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl">
          Browse Medicines
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setError('Please fill in all mandatory customer and delivery details.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Generate Clean Order Reference Number (e.g. MP-2026-8392)
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `MP-${new Date().getFullYear()}-${randomNum}`;

      // 1. Insert Order into Database
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert([
          {
            order_number: orderNumber,
            customer_name: customerName.trim(),
            customer_phone: phone.trim(),
            customer_email: email.trim() || null,
            delivery_address: `${address.trim()} (${addressType.toUpperCase()})`,
            city: city.trim(),
            total_amount: finalTotal,
            status: 'pending',
            payment_method: paymentMethod,
            notes: orderNotes.trim() ? `${orderNotes.trim()} | WhatsApp: ${whatsapp || phone}` : `WhatsApp: ${whatsapp || phone}`,
          },
        ])
        .select()
        .single();

      if (orderErr) throw new Error(orderErr.message);

      // 2. Insert Order Items
      const orderItemsToInsert = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        unit_price: Number(item.product.price),
        quantity: item.quantity,
        total_price: Number(item.product.price) * item.quantity,
        thumbnail_url: item.product.thumbnail_url,
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsToInsert);
      if (itemsErr) console.warn('Order items insert notice:', itemsErr.message);

      // 3. Clear shopping cart & show confirmation
      clearCart();
      setOrderCompleted({ orderNumber, total: finalTotal });
      window.dispatchEvent(new Event('myko_orders_updated'));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not process order. Please try again or order on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8 w-full max-w-full overflow-x-hidden">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/cart/" className="hover:text-blue-600">Cart</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900">Checkout</span>
      </nav>

      {orderCompleted ? (
        /* Order Confirmed Screen */
        <div className="max-w-2xl mx-auto bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-12 border border-slate-100 shadow-xl text-center space-y-4 sm:space-y-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-xl sm:text-3xl font-black text-slate-950">
              Order Confirmed!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Thank you for ordering with <span className="font-bold text-slate-900">MykoTech Pharma Pvt Ltd</span>. Your order is registered in our dispatch system.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
            <div className="text-xs sm:text-sm font-black text-blue-950">
              Order Number: <span className="text-blue-700">{orderCompleted.orderNumber}</span>
            </div>
            <div className="font-bold">Total Payable: Rs. {orderCompleted.total.toFixed(2)}</div>
            <p className="text-slate-500 pt-1 text-[11px] sm:text-xs">
              Payment Mode: {paymentMethod.toUpperCase()} &bull; Delivery: Home Doorstep
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2">
            <a
              href={`https://wa.me/923184008718?text=${encodeURIComponent(
                `Hello MykoTech Pharma, I just placed order #${orderCompleted.orderNumber} for Rs. ${orderCompleted.total}. Customer: ${customerName} (${phone}). Please confirm delivery.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Track on WhatsApp</span>
            </a>

            <Link
              href="/"
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              Back to Home
            </Link>
          </div>
        </div>
      ) : (
        /* Checkout Form */
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
          
          {/* Left: Customer & Address Information */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Step 1: Customer Details */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-100 shadow-sm space-y-4 sm:space-y-5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Truck className="w-5 h-5 text-blue-600" />
                1. Delivery & Contact Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Irfan Shahid"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0314-5200832"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    WhatsApp Number (for order tracking)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 0318-4008718"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. patient@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* City Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    City *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                  >
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Multan">Multan</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Gujranwala">Gujranwala</option>
                    <option value="Sialkot">Sialkot</option>
                    <option value="Quetta">Quetta</option>
                    <option value="Other">Other City (All Pakistan)</option>
                  </select>
                </div>

                {/* Address Type Selector Cards */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Delivery Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddressType('home')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                        addressType === 'home'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      Home (Anytime)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressType('office')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                        addressType === 'office'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      Office (9am - 6pm)
                    </button>
                  </div>
                </div>
              </div>

              {/* Street Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Full Street Address (House/Flat No, Street, Sector, Area) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. House 14, Street 25, Sector G-10/4, Islamabad"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Order Special Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please call before arriving or deliver to gatekeeper..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Step 2: Payment Method Accordion */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-100 shadow-sm space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                2. Select Payment Method
              </h3>

              <div className="space-y-3">
                {/* Cash On Delivery (COD) */}
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-600/10'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">
                      Cash on Delivery (COD)
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pay cash in hand when our courier delivers the sealed parcel at your doorstep.
                    </p>
                  </div>
                </label>

                {/* JazzCash */}
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'jazzcash'
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-600/10'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'jazzcash'}
                    onChange={() => setPaymentMethod('jazzcash')}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-red-600" />
                      JazzCash Mobile Account
                    </div>
                    {paymentMethod === 'jazzcash' && (
                      <div className="mt-2 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-600">Account Title:</span>
                          <span className="font-extrabold text-slate-900">{settings.jazzcash_title || 'Irfan Shahid Khan (MykoTech Pharma)'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="font-bold text-slate-600">Account Number:</span>
                          <span className="text-red-700 font-mono font-extrabold text-sm">{settings.jazzcash_number || '0318-4008718'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 italic pt-1">Please share payment receipt or transaction screenshot on WhatsApp after placing order.</p>
                      </div>
                    )}
                  </div>
                </label>

                {/* EasyPaisa */}
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'easypaisa'
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-600/10'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'easypaisa'}
                    onChange={() => setPaymentMethod('easypaisa')}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      EasyPaisa Mobile Account
                    </div>
                    {paymentMethod === 'easypaisa' && (
                      <div className="mt-2 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-600">Account Title:</span>
                          <span className="font-extrabold text-slate-900">{settings.easypaisa_title || 'Irfan Shahid Khan (MykoTech Pharma)'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="font-bold text-slate-600">Account Number:</span>
                          <span className="text-emerald-700 font-mono font-extrabold text-sm">{settings.easypaisa_number || '0314-5200832'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 italic pt-1">Please send transaction confirmation via WhatsApp at 0318-4008718.</p>
                      </div>
                    )}
                  </div>
                </label>

                {/* Bank Transfer */}
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'bank'
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-600/10'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'bank'}
                    onChange={() => setPaymentMethod('bank')}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-700" />
                      Online Direct Bank Transfer (IBAN)
                    </div>
                    {paymentMethod === 'bank' && (
                      <div className="mt-2 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-600">Bank Name:</span>
                          <span className="font-extrabold text-slate-900">{settings.bank_name || 'Meezan Bank Limited'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="font-bold text-slate-600">Account Title:</span>
                          <span className="font-extrabold text-slate-900">{settings.bank_account_title || 'Mykotech Pharmaceuticals Pvt Ltd'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="font-bold text-slate-600">IBAN / Account:</span>
                          <span className="text-blue-700 font-mono font-extrabold text-xs sm:text-sm">{settings.bank_iban || 'PK45MEZN0001234567890123'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Summary & Place Order Button */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm space-y-4 sm:space-y-5 sticky top-24">
              <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs text-blue-600 font-bold">{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
              </h3>

              {/* Item preview list */}
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                    <div className="truncate">
                      <div className="font-bold text-slate-900 truncate">{item.product.name}</div>
                      <div className="text-[10px] text-slate-400">Qty: {item.quantity} &bull; Rs. {Number(item.product.price)}</div>
                    </div>
                    <div className="font-black text-slate-900 shrink-0">
                      Rs. {(Number(item.product.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Details */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">Rs. {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-blue-700 font-semibold">
                    <span>Coupon ({couponCode})</span>
                    <span>-Rs. {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-slate-900">
                    {shippingFee === 0 ? <span className="text-blue-700">FREE</span> : `Rs. ${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-black text-slate-950 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span>Rs. {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-700/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Order & Home Delivery</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-400 text-center space-y-1">
                <p>Licensed under Pharmacy Council & DRAP regulations.</p>
                <p>Helpline: 0314-5200832 | WhatsApp: 0318-4008718</p>
              </div>
            </div>
          </div>
        </form>
      )}

    </div>
  );
}
