'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  LayoutDashboard,
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  FolderTree, 
  Image as ImageIcon, 
  ShoppingBag, 
  FileText, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Printer, 
  Download, 
  X, 
  Save, 
  ChevronRight,
  ExternalLink,
  Star,
  Eye,
  ShieldCheck,
  TrendingUp,
  Clock,
  Pill,
  Building,
  Smartphone,
  Pencil,
  Milk,
  Droplet,
  Sparkles,
  Syringe,
  Shield
} from 'lucide-react';
import { 
  getProducts, 
  saveProduct, 
  deleteProduct, 
  getCategories, 
  addCategory, 
  updateCategory,
  deleteCategory, 
  addSubCategory, 
  deleteSubCategory, 
  getHeroBanners, 
  saveHeroBanner, 
  deleteHeroBanner, 
  getOrders, 
  updateOrderStatus, 
  deleteOrder,
  getPrescriptions,
  deletePrescription,
  getStoreSettings, 
  saveStoreSettings 
} from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Product, Category, SubCategory, HeroBanner, Order, StoreSettings, Prescription } from '@/types';
import { SingleImageUploader } from '@/components/admin/SingleImageUploader';
import { MultiImageUploader } from '@/components/admin/MultiImageUploader';
import { useAdmin } from './AdminContext';

export default function AdminDashboardPage() {
  // Navigation / Tabs controlled by fixed sidebar
  const { activeTab, setActiveTab } = useAdmin();

  // Master State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(getStoreSettings());
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [productSearch, setProductSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [selectedSubCatFilter, setSelectedSubCatFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('💊');

  const [subCatModalOpen, setSubCatModalOpen] = useState(false);
  const [parentCatId, setParentCatId] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubSlug, setNewSubSlug] = useState('');

  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<HeroBanner> | null>(null);

  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [previewPrescription, setPreviewPrescription] = useState<Prescription | null>(null);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    itemType: string;
    onConfirm: () => Promise<void>;
    isDeleting?: boolean;
  } | null>(null);

  const triggerToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  // Master Data Refresh
  const refreshAll = async () => {
    try {
      setLoading(true);
      const [p, c, b, o, rxRes] = await Promise.all([
        getProducts({ onlyActive: false }),
        getCategories(),
        getHeroBanners(),
        getOrders(),
        supabase.from('prescriptions').select('*').order('created_at', { ascending: false }),
      ]);
      setProducts(p);
      setCategories(c);
      setBanners(b);
      setOrders(o);
      if (rxRes.data) setPrescriptions(rxRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCatFilter !== 'all' && p.category_id !== selectedCatFilter) return false;
      if (selectedSubCatFilter !== 'all' && p.sub_category_id !== selectedSubCatFilter) return false;
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.generic_name?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, selectedCatFilter, selectedSubCatFilter, productSearch]);

  const renderCatIcon = (icon?: string, className = "w-5 h-5") => {
    if (!icon) return <Pill className={className} />;
    if (icon.startsWith('http') || icon.startsWith('data:image') || icon.startsWith('/')) {
      return <img src={icon} alt="" className={`${className} object-contain rounded-md`} />;
    }
    if (/\p{Emoji}/u.test(icon) || (icon.length <= 4 && !/^[A-Za-z]+$/.test(icon))) {
      return <span className="inline-block leading-none text-base select-none">{icon}</span>;
    }
    const lucideMap: Record<string, React.ReactNode> = {
      Pill: <Pill className={className} />,
      Milk: <Milk className={className} />,
      Droplet: <Droplet className={className} />,
      Sparkles: <Sparkles className={className} />,
      Syringe: <Syringe className={className} />,
      Shield: <Shield className={className} />,
    };
    return lucideMap[icon] || <Pill className={className} />;
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      return true;
    });
  }, [orders, orderStatusFilter]);

  // -------------------------------------------------------------
  // PRODUCTS CRUD HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddProduct = () => {
    setEditingProduct({
      name: '',
      slug: '',
      generic_name: '',
      dosage: '',
      category_id: categories[0]?.id || '',
      sub_category_id: '',
      price: 0,
      original_price: 0,
      stock: 100,
      thumbnail_url: '',
      gallery_urls: [],
      short_description: '',
      description: '',
      composition: '',
      dosage_instructions: '',
      side_effects: '',
      requires_prescription: false,
      is_active: true,
      is_featured: false,
    });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    const rawGallery = Array.isArray(p.gallery_urls) && p.gallery_urls.length > 0
      ? p.gallery_urls
      : (p.thumbnail_url ? [p.thumbnail_url] : []);
    
    const initialGallery = Array.from(new Set(rawGallery.filter(Boolean)));

    setEditingProduct({
      ...p,
      thumbnail_url: p.thumbnail_url || (initialGallery[0] || ''),
      gallery_urls: initialGallery,
      description: p.description || '',
      composition: p.composition || '',
      dosage_instructions: p.dosage_instructions || '',
      side_effects: p.side_effects || '',
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) return;

    try {
      const slug = editingProduct.slug || editingProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const gallery = Array.isArray(editingProduct.gallery_urls) ? editingProduct.gallery_urls : [];
      const primaryThumb = editingProduct.thumbnail_url || gallery[0] || '';

      await saveProduct({
        ...editingProduct,
        slug,
        thumbnail_url: primaryThumb,
        gallery_urls: gallery,
        short_description: editingProduct.short_description || (editingProduct.description ? editingProduct.description.slice(0, 160) : ''),
        description: editingProduct.description || '',
        composition: editingProduct.composition || '',
        dosage_instructions: editingProduct.dosage_instructions || '',
        side_effects: editingProduct.side_effects || '',
      });
      setProductModalOpen(false);
      triggerToast('Medicine formulation saved successfully in cloud database!');
      refreshAll();
    } catch (err: any) {
      triggerError(`Error saving product: ${err.message}`);
    }
  };

  const confirmDeleteProduct = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Medicine Formulation',
      itemName: name,
      itemType: 'product',
      onConfirm: async () => {
        await deleteProduct(id);
        triggerToast(`"${name}" deleted from database.`);
        await refreshAll();
      },
    });
  };

  // CSV Export
  const handleDownloadCsv = () => {
    const headers = ['id', 'name', 'slug', 'generic_name', 'dosage', 'price', 'original_price', 'stock', 'thumbnail_url', 'requires_prescription', 'is_active'];
    const rows = products.map((p: any) => headers.map(h => JSON.stringify(p[h] ?? '')).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mykotech_products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // CATEGORIES CRUD HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setNewCatName('');
    setNewCatSlug('');
    setNewCatDesc('');
    setNewCatIcon('💊');
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setNewCatSlug(cat.slug);
    setNewCatDesc(cat.description || '');
    setNewCatIcon(cat.icon || '💊');
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const slug = newCatSlug.trim() || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: newCatName.trim(),
          slug,
          description: newCatDesc.trim(),
          icon: newCatIcon,
        });
        triggerToast(`Category "${newCatName}" updated successfully!`);
      } else {
        await addCategory({
          name: newCatName.trim(),
          slug,
          description: newCatDesc.trim(),
          icon: newCatIcon,
          display_order: categories.length + 1,
        });
        triggerToast('Category created successfully!');
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDesc('');
      setNewCatIcon('💊');
      refreshAll();
    } catch (err: any) {
      triggerError(err.message);
    }
  };

  const confirmDeleteCategory = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Therapeutic Category',
      itemName: name,
      itemType: 'category',
      onConfirm: async () => {
        await deleteCategory(id);
        triggerToast(`Category "${name}" deleted.`);
        await refreshAll();
      },
    });
  };

  const handleOpenAddSubCat = (catId: string) => {
    setParentCatId(catId);
    setNewSubName('');
    setNewSubSlug('');
    setSubCatModalOpen(true);
  };

  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !parentCatId) return;
    try {
      const slug = newSubSlug.trim() || newSubName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await addSubCategory({ category_id: parentCatId, name: newSubName.trim(), slug });
      setSubCatModalOpen(false);
      triggerToast('Subcategory created successfully!');
      refreshAll();
    } catch (err: any) {
      triggerError(err.message);
    }
  };

  const confirmDeleteSubCategory = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Subcategory',
      itemName: name,
      itemType: 'subcategory',
      onConfirm: async () => {
        await deleteSubCategory(id);
        triggerToast(`Subcategory "${name}" deleted.`);
        await refreshAll();
      },
    });
  };

  // -------------------------------------------------------------
  // BANNERS CRUD HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddBanner = () => {
    setEditingBanner({
      title: 'Promotional Banner',
      subtitle: '',
      cta_text: 'Order Now',
      cta_link: '/products/',
      image_url: '',
      badge: '',
      display_order: (banners.length + 1),
      is_active: true,
    });
    setBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: HeroBanner) => {
    setEditingBanner({
      ...b,
      title: b.title || 'Promotional Banner',
      cta_link: b.cta_link || '/products/',
      display_order: b.display_order ?? 1,
      is_active: b.is_active !== false,
    });
    setBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.image_url) {
      triggerError('Please upload or provide a banner image.');
      return;
    }
    try {
      const bannerPayload = {
        ...editingBanner,
        title: editingBanner.title?.trim() || 'Promotional Banner',
        subtitle: editingBanner.subtitle || '',
        cta_text: editingBanner.cta_text || 'Order Now',
        cta_link: editingBanner.cta_link?.trim() || '/products/',
        badge: editingBanner.badge || '',
        display_order: Number(editingBanner.display_order) || 1,
        is_active: editingBanner.is_active !== false,
      };
      await saveHeroBanner(bannerPayload);
      setBannerModalOpen(false);
      triggerToast('Banner saved successfully!');
      refreshAll();
    } catch (err: any) {
      triggerError(err.message);
    }
  };

  const confirmDeleteBanner = (id: string, title?: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Hero Banner',
      itemName: title || 'Hero Banner',
      itemType: 'banner',
      onConfirm: async () => {
        await deleteHeroBanner(id);
        triggerToast('Hero banner deleted.');
        await refreshAll();
      },
    });
  };

  // -------------------------------------------------------------
  // ORDERS & PRESCRIPTIONS CRUD HANDLERS
  // -------------------------------------------------------------
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      triggerToast(`Order status updated to ${status}.`);
      refreshAll();
    } catch (err: any) {
      triggerError(err.message);
    }
  };

  const confirmDeleteOrder = (id: string, orderNumber: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Order Record',
      itemName: `Order #${orderNumber}`,
      itemType: 'order',
      onConfirm: async () => {
        await deleteOrder(id);
        triggerToast(`Order #${orderNumber} deleted.`);
        await refreshAll();
      },
    });
  };

  const handleUpdateRxStatus = async (rxId: string, status: Prescription['status']) => {
    try {
      await supabase.from('prescriptions').update({ status }).eq('id', rxId);
      triggerToast(`Prescription marked as ${status}.`);
      refreshAll();
    } catch (err: any) {
      triggerError(err.message);
    }
  };

  const confirmDeleteRx = (id: string, patientName: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Prescription Slip',
      itemName: `Slip for ${patientName}`,
      itemType: 'prescription',
      onConfirm: async () => {
        await deletePrescription(id);
        triggerToast(`Prescription slip for ${patientName} deleted.`);
        await refreshAll();
      },
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreSettings(settings);
    triggerToast('Store & Payment settings saved successfully!');
  };

  return (
    <div className="space-y-8">
      
      {/* Toast Notifications */}
      {actionSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-20 right-6 z-50 bg-rose-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. TOP STATS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Products</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{products.length}</div>
            <span className="text-[10px] text-emerald-600 font-bold">In Active Catalog</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Categories</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{categories.length}</div>
            <span className="text-[10px] text-blue-600 font-bold">Multi-Subcategories</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <FolderTree className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Total Orders</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{orders.length}</div>
            <span className="text-[10px] text-purple-600 font-bold">Home Deliveries</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Prescriptions</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{prescriptions.length}</div>
            <span className="text-[10px] text-amber-600 font-bold">Doctor Slips</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          TAB 0: MASTER DASHBOARD OVERVIEW
      ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <section id="master-dashboard" className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-900">Master Control Hub</h3>
              <p className="text-xs text-slate-500 mt-1">
                Welcome to MykoTech Pharma administration portal. Quick access to all core operational hubs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className="p-5 rounded-2xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-100 text-left transition-all group cursor-pointer hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Products Catalog</h4>
                <p className="text-xs text-slate-500 mt-1">Manage medicines, formulations, prices, and stock inventory ({products.length} formulations active).</p>
                <span className="text-xs font-bold text-blue-600 mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Manage Products &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className="p-5 rounded-2xl bg-cyan-50/70 hover:bg-cyan-100/70 border border-cyan-100 text-left transition-all group cursor-pointer hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition-transform">
                  <FolderTree className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Categories & Subcategories</h4>
                <p className="text-xs text-slate-500 mt-1">Configure therapeutic categories and multi-level hierarchy ({categories.length} main categories).</p>
                <span className="text-xs font-bold text-cyan-700 mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Manage Categories &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('banners')}
                className="p-5 rounded-2xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-100 text-left transition-all group cursor-pointer hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Hero & Promotional Banners</h4>
                <p className="text-xs text-slate-500 mt-1">Upload and edit homepage rotating banners and promotional links ({banners.length} banners).</p>
                <span className="text-xs font-bold text-purple-700 mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Manage Banners &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="p-5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-100 text-left transition-all group cursor-pointer hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Order Manager & Invoices</h4>
                <p className="text-xs text-slate-500 mt-1">View customer home deliveries and print clinical PDF invoices ({orders.length} orders recorded).</p>
                <span className="text-xs font-bold text-emerald-700 mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Orders & Invoices &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('prescriptions')}
                className="p-5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-100 text-left transition-all group cursor-pointer hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Prescription Slips</h4>
                <p className="text-xs text-slate-500 mt-1">Pharmacist verification for uploaded doctor slips ({prescriptions.length} slips).</p>
                <span className="text-xs font-bold text-amber-700 mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Prescriptions &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group cursor-pointer hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition-transform">
                  <Settings className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Store & Bank Settings</h4>
                <p className="text-xs text-slate-500 mt-1">Configure company NTN, DRAP license, helpline, and bank accounts.</p>
                <span className="text-xs font-bold text-slate-700 mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Store & Payment Settings &rarr;
                </span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          TAB 1: PRODUCTS MANAGER
      ------------------------------------------------------------- */}
      {activeTab === 'products' && (
        <section id="products-manager" className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            
            {/* Header with Search and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Products Catalog Management</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add, edit, or delete pharmaceutical formulations. Automatic WebP image compression enabled.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleDownloadCsv}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Download products CSV for client"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div className="w-full sm:w-72 relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium">Category:</span>
                <select
                  value={selectedCatFilter}
                  onChange={(e) => {
                    setSelectedCatFilter(e.target.value);
                    setSelectedSubCatFilter('all');
                  }}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {selectedCatFilter !== 'all' && (
                  <select
                    value={selectedSubCatFilter}
                    onChange={(e) => setSelectedSubCatFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="all">All Subcategories</option>
                    {categories
                      .find((c) => c.id === selectedCatFilter)
                      ?.sub_categories?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Medicine & Category</th>
                    <th className="py-3 px-4">Dosage / Formula</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Rx</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 p-1 shrink-0 flex items-center justify-center">
                            <img src={p.thumbnail_url || '/logo.png'} alt={p.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">{p.name}</div>
                            <span className="text-[10px] text-slate-400 block">{p.slug}</span>
                            {(() => {
                              const cat = categories.find((c) => c.id === p.category_id);
                              const sub = cat?.sub_categories?.find((s) => s.id === p.sub_category_id);
                              return (
                                <div className="flex items-center gap-1.5 mt-1">
                                  {cat && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[9px]">
                                      {renderCatIcon(cat.icon, 'w-2.5 h-2.5')}
                                      <span>{cat.name}</span>
                                    </span>
                                  )}
                                  {sub && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[9px]">
                                      &bull; {sub.name}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{p.dosage || '—'}</div>
                        <span className="text-[10px] text-slate-500">{p.generic_name || 'Standard'}</span>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        Rs. {Number(p.price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          p.stock > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.requires_prescription ? (
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-50 text-amber-800">Required</span>
                        ) : (
                          <span className="text-slate-400">OTC</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          TAB 2: CATEGORIES & SUB-CATEGORIES
      ------------------------------------------------------------- */}
      {activeTab === 'categories' && (
        <section id="categories-manager" className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Hierarchical Categories Manager</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage primary categories (Tablets, Syrups, Drops, Food Supplements) and nested subcategories.
                </p>
              </div>

              <button
                onClick={handleOpenAddCategory}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Primary Category</span>
              </button>
            </div>

            {/* Tree View of Categories */}
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 flex items-center justify-center font-bold shrink-0 shadow-2xs overflow-hidden p-1">
                        {renderCatIcon(cat.icon, "w-6 h-6")}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <span>{cat.name}</span>
                          {cat.icon && (
                            <span className="text-xs text-slate-400 font-normal">
                              ({cat.icon.startsWith('http') || cat.icon.startsWith('data:') ? 'Image' : cat.icon})
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-slate-400">/{cat.slug} &bull; {cat.description || 'No description'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Edit category image, emoji, or details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleOpenAddSubCat(cat.id)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Subcategory</span>
                      </button>
                      <button
                        onClick={() => confirmDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories pill grid */}
                  {cat.sub_categories && cat.sub_categories.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
                      {cat.sub_categories.map((sub) => (
                        <div
                          key={sub.id}
                          className="pl-3 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs"
                        >
                          <span>{sub.name}</span>
                          <button
                            onClick={() => confirmDeleteSubCategory(sub.id, sub.name)}
                            className="text-slate-300 hover:text-rose-500 p-0.5 cursor-pointer"
                            title="Remove subcategory"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic pt-1">
                      No subcategories added yet. Click &quot;Add Subcategory&quot; to create nested groups.
                    </p>
                  )}
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          TAB 3: HERO BANNERS
      ------------------------------------------------------------- */}
      {activeTab === 'banners' && (
        <section id="banners-manager" className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Website Hero & Promotional Banners</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage homepage banners with ultra-light WebP graphics and responsive controls.
                </p>
              </div>

              <button
                onClick={handleOpenAddBanner}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Banner</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banners.map((b, idx) => (
                <div key={b.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs flex flex-col hover:border-slate-300 transition-all">
                  <div className="w-full aspect-[21/9] bg-slate-900 relative overflow-hidden">
                    <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-600/90 backdrop-blur-xs text-white font-extrabold text-[10px] shadow-sm">
                        Slide #{b.display_order ?? idx + 1}
                      </span>
                      {b.is_active === false && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-600/90 backdrop-blur-xs text-white font-bold text-[10px]">
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm truncate">{b.title || `Promotional Banner ${idx + 1}`}</h4>
                        <span className="text-[11px] font-bold text-slate-400 shrink-0">Order: {b.display_order ?? 1}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 truncate">
                        <span className="font-semibold text-slate-600">Links to:</span>
                        <code className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] font-bold truncate">
                          {b.cta_link || '/products/'}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
                      <button
                        onClick={() => handleOpenEditBanner(b)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Banner</span>
                      </button>
                      <button
                        onClick={() => confirmDeleteBanner(b.id, b.title)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          TAB 4: ORDERS & PRINTABLE INVOICE
      ------------------------------------------------------------- */}
      {activeTab === 'orders' && (
        <section id="orders-manager" className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Order Management & Invoicing</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track customer orders, update delivery statuses, and print pristine PDF invoices.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">City / Address</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900">{o.order_number}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{o.customer_name}</div>
                        <span className="text-slate-500 text-[11px]">{o.customer_phone}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-700">{o.city}</span>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{o.delivery_address}</div>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        Rs. {Number(o.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as any)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                            o.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            o.status === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            o.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setInvoiceOrder(o)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                          <button
                            onClick={() => confirmDeleteOrder(o.id, o.order_number)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Order Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          TAB 5: PRESCRIPTION SLIPS
      ------------------------------------------------------------- */}
      {activeTab === 'prescriptions' && (
        <section id="prescriptions-manager" className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Doctor Prescriptions Review</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and verify patient prescription slips uploaded via storefront.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-44 bg-white rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center p-2 relative">
                      <img src={rx.image_url} alt="Prescription" className="w-full h-full object-contain" />
                      <button
                        onClick={() => setPreviewPrescription(rx)}
                        className="absolute bottom-2 right-2 p-1.5 bg-slate-900/80 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{rx.patient_name}</h4>
                      <p className="text-xs font-bold text-blue-600">Phone: {rx.phone}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{rx.notes}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {new Date(rx.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={rx.status}
                        onChange={(e) => handleUpdateRxStatus(rx.id, e.target.value as any)}
                        className="px-2 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="order_created">Order Placed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button
                        onClick={() => confirmDeleteRx(rx.id, rx.patient_name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Prescription Slip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          TAB 6: STORE & PAYMENT SETTINGS
      ------------------------------------------------------------- */}
      {activeTab === 'settings' && (
        <section id="settings-manager" className="space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Store Identity & Payment Configuration</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  All updates here immediately hydrate the storefront header, footer, checkout, and invoice.
                </p>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md shadow-blue-600/20"
              >
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Official Store Name</label>
                <input
                  type="text"
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tagline / Slogan</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Helpline Call Number</label>
                <input
                  type="text"
                  value={settings.helpline_phone}
                  onChange={(e) => setSettings({ ...settings, helpline_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Official WhatsApp Number</label>
                <input
                  type="text"
                  value={settings.whatsapp_number}
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Official Email</label>
                <input
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">NTN / Tax Number</label>
                <input
                  type="text"
                  value={settings.ntn_number}
                  onChange={(e) => setSettings({ ...settings, ntn_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Physical Warehouse & Dispatch Address</label>
                <input
                  type="text"
                  value={settings.warehouse_address}
                  onChange={(e) => setSettings({ ...settings, warehouse_address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Delivery Rates */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Base Shipping Fee (Rs.)</label>
                <input
                  type="number"
                  value={settings.base_shipping_fee}
                  onChange={(e) => setSettings({ ...settings, base_shipping_fee: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Free Delivery Spend Limit (Rs.)</label>
                <input
                  type="number"
                  value={settings.free_shipping_threshold}
                  onChange={(e) => setSettings({ ...settings, free_shipping_threshold: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* 1. Direct Bank Transfer Settings */}
              <div className="sm:col-span-2 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  Direct Online Bank Transfer (IBAN)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  These bank details appear directly on the Checkout page when customers choose Direct Bank Transfer.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Bank Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Meezan Bank Limited, HBL, Bank Alfalah"
                  value={settings.bank_name || ''}
                  onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Bank Account Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Mykotech Pharmaceuticals Pvt Ltd / Irfan Shahid Khan"
                  value={settings.bank_account_title || ''}
                  onChange={(e) => setSettings({ ...settings, bank_account_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Bank IBAN / Account Number *</label>
                <input
                  type="text"
                  placeholder="e.g. PK45MEZN0001234567890123"
                  value={settings.bank_iban || ''}
                  onChange={(e) => setSettings({ ...settings, bank_iban: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              {/* 2. JazzCash Settings */}
              <div className="sm:col-span-2 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-red-600" />
                  JazzCash Mobile Account Details
                </h4>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">JazzCash Account Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Irfan Shahid Khan / MykoTech Pharma"
                  value={settings.jazzcash_title || ''}
                  onChange={(e) => setSettings({ ...settings, jazzcash_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">JazzCash Mobile Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 0318-4008718"
                  value={settings.jazzcash_number || ''}
                  onChange={(e) => setSettings({ ...settings, jazzcash_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              {/* 3. EasyPaisa Settings */}
              <div className="sm:col-span-2 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  EasyPaisa Mobile Account Details
                </h4>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">EasyPaisa Account Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Irfan Shahid Khan / MykoTech Pharma"
                  value={settings.easypaisa_title || ''}
                  onChange={(e) => setSettings({ ...settings, easypaisa_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">EasyPaisa Mobile Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 0314-5200832"
                  value={settings.easypaisa_number || ''}
                  onChange={(e) => setSettings({ ...settings, easypaisa_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>

          </form>
        </section>
      )}

      {/* -------------------------------------------------------------
          MODAL 1: ADD / EDIT PRODUCT (WITH WEBP MULTI-IMAGE UPLOADER)
      ------------------------------------------------------------- */}
      {productModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                {editingProduct.id ? 'Edit Medicine Formulation' : 'Add New Medicine'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5">
              
              {/* Product Multi-Images & Gallery Section */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      Medicine Packaging & Angle Photos
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Upload front packaging and multiple angles. Mark any photo with the Star badge ⭐ as Primary Cover.
                    </p>
                  </div>
                </div>

                <MultiImageUploader
                  key={editingProduct.id || 'new-product-modal'}
                  primaryUrl={editingProduct.thumbnail_url || ''}
                  initialUrls={editingProduct.gallery_urls || []}
                  onChange={(urls, primary) => {
                    setEditingProduct((prev) =>
                      prev
                        ? {
                            ...prev,
                            thumbnail_url: primary,
                            gallery_urls: urls,
                          }
                        : null
                    );
                  }}
                  folder="products"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Dosage / Formulation *</label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg, 10ml, 20 tablets"
                    value={editingProduct.dosage || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, dosage: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Generic Formula</label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol, Amoxicillin"
                    value={editingProduct.generic_name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, generic_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Primary Category *</label>
                  <select
                    value={editingProduct.category_id || (categories[0]?.id || '')}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      const catObj = categories.find((c) => c.id === newCatId);
                      const hasCurrentSub = catObj?.sub_categories?.some(
                        (s) => s.id === editingProduct.sub_category_id
                      );
                      setEditingProduct({
                        ...editingProduct,
                        category_id: newCatId,
                        sub_category_id: hasCurrentSub ? editingProduct.sub_category_id : '',
                      });
                    }}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Nested Subcategory</label>
                    <span className="text-[10px] text-blue-600 font-semibold">
                      {(() => {
                        const activeCat = categories.find(
                          (c) => c.id === (editingProduct.category_id || categories[0]?.id)
                        );
                        return activeCat?.sub_categories?.length
                          ? `${activeCat.sub_categories.length} available`
                          : 'None created yet';
                      })()}
                    </span>
                  </div>
                  <select
                    value={editingProduct.sub_category_id || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        sub_category_id: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="">-- No Subcategory / General --</option>
                    {categories
                      .find((c) => c.id === (editingProduct.category_id || categories[0]?.id))
                      ?.sub_categories?.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Retail Price (Rs.) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Original / MRP Price (Rs.)</label>
                  <input
                    type="number"
                    value={editingProduct.original_price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, original_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Available Stock Quantity</label>
                  <input
                    type="number"
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.requires_prescription || false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, requires_prescription: e.target.checked })}
                      className="rounded text-blue-600 h-4 w-4"
                    />
                    <span>Requires Rx</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.is_featured || false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                      className="rounded text-blue-600 h-4 w-4"
                    />
                    <span>Featured ⭐</span>
                  </label>
                </div>
              </div>

              {/* Comprehensive Clinical Specifications & Indications */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Clinical Specifications & Medical Information
                  </h4>
                </div>

                {/* 1. Therapeutic Indications & Description */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Therapeutic Indications & Description
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">Shows on product detail page</span>
                  </div>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="e.g. Mykoclav 625mg contains Amoxicillin and Clavulanic acid. It works by killing bacteria that cause infections..."
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 2. Composition / Ingredients */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Composition / Ingredients
                    </label>
                    <textarea
                      rows={3}
                      value={editingProduct.composition || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, composition: e.target.value })}
                      placeholder="e.g. Each film-coated tablet contains Amoxicillin Trihydrate USP 500mg, Clavulanic Acid 125mg..."
                      className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl resize-y"
                    />
                  </div>

                  {/* 3. Dosage & Administration */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Dosage & Administration
                    </label>
                    <textarea
                      rows={3}
                      value={editingProduct.dosage_instructions || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, dosage_instructions: e.target.value })}
                      placeholder="e.g. One tablet twice daily after meals or as directed by a registered medical practitioner..."
                      className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl resize-y"
                    />
                  </div>
                </div>

                {/* 4. Precautions & Potential Side Effects */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-800">
                      Precautions & Potential Side Effects
                    </label>
                    <span className="text-[10px] text-amber-600 font-semibold">Patient safety advice</span>
                  </div>
                  <textarea
                    rows={2}
                    value={editingProduct.side_effects || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, side_effects: e.target.value })}
                    placeholder="e.g. Mild diarrhea, nausea, skin rash, abdominal discomfort. Contraindicated in penicillin allergy..."
                    className="w-full px-3 py-2 text-xs font-semibold bg-amber-50/40 border border-amber-200/60 rounded-xl resize-y"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-md"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 2: ADD CATEGORY
      ------------------------------------------------------------- */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingCategory ? 'Edit Therapeutic Category' : 'Add Primary Category'}
              </h3>
              <button 
                onClick={() => {
                  setCategoryModalOpen(false);
                  setEditingCategory(null);
                }} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Injections & Infusions"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <input
                  type="text"
                  placeholder="Short therapeutic explanation..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Category Icon / Medical Emoji / Image Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Category Visual Icon, Emoji, or Image
                  </label>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200/80">
                    <span className="text-[10px] text-slate-500 font-bold">Preview:</span>
                    <div className="w-6 h-6 flex items-center justify-center font-bold text-blue-700">
                      {renderCatIcon(newCatIcon, "w-5 h-5")}
                    </div>
                  </div>
                </div>

                {/* Quick-Pick Medical Emojis */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Quick Select Pharmaceutical Emojis:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { emoji: '💊', label: 'Tablets' },
                      { emoji: '🧴', label: 'Syrups' },
                      { emoji: '💧', label: 'Drops' },
                      { emoji: '🥗', label: 'Supplements' },
                      { emoji: '💉', label: 'Injections' },
                      { emoji: '🩹', label: 'Derma / Creams' },
                      { emoji: '🩺', label: 'Clinical' },
                      { emoji: '🌿', label: 'Herbal' },
                      { emoji: '🧪', label: 'Lab Formulas' },
                      { emoji: '👶', label: 'Pediatric' },
                      { emoji: '🧬', label: 'Biotech' },
                      { emoji: '🛡️', label: 'Protection' },
                    ].map((item) => (
                      <button
                        key={item.emoji}
                        type="button"
                        onClick={() => setNewCatIcon(item.emoji)}
                        className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          newCatIcon === item.emoji
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm">{item.emoji}</span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Emoji / Lucide Icon Name Input */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Or Enter Custom Emoji / Icon Code:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 💊, 🧴, 💧, or Pill, Milk, Droplet, Sparkles"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                {/* Image Upload Component for Category Image */}
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Or Upload Custom Category Graphic:
                  </label>
                  <SingleImageUploader
                    currentUrl={newCatIcon.startsWith('http') || newCatIcon.startsWith('data:') ? newCatIcon : ''}
                    onUploadSuccess={(url) => setNewCatIcon(url)}
                    label="Upload Category Graphic (<50KB WebP)"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 3: ADD SUBCATEGORY
      ------------------------------------------------------------- */}
      {subCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Add Nested Subcategory</h3>
              <button onClick={() => setSubCatModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Subcategory Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pediatric Vitamin Drops"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubCatModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  Save Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 4: HERO BANNER
      ------------------------------------------------------------- */}
      {bannerModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Hero Banner Configuration</h3>
              <button onClick={() => setBannerModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              <SingleImageUploader
                currentUrl={editingBanner.image_url}
                onUploadSuccess={(url) => setEditingBanner({ ...editingBanner, image_url: url })}
                folder="banners"
                label="Banner Graphic Image"
              />

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Target Page / Destination Link *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /products/ or /products/category/food-supplements/"
                  value={editingBanner.cta_link || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, cta_link: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400">Page opened when a customer taps or clicks this banner graphic.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={editingBanner.display_order ?? 1}
                    onChange={(e) => setEditingBanner({ ...editingBanner, display_order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400">1 = First slide, 2 = Second slide, etc.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Banner Label (Admin Reference)</label>
                  <input
                    type="text"
                    placeholder="e.g. Vitamin Syrup Promo"
                    value={editingBanner.title || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400">Internal title to recognize banner in Admin.</p>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingBanner.is_active !== false}
                    onChange={(e) => setEditingBanner({ ...editingBanner, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">Active (Visible on Homepage)</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 5: PRISTINE PRINTABLE PDF INVOICE (#printable-invoice)
      ------------------------------------------------------------- */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 print:static print:bg-transparent print:p-0">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto print:shadow-none print:p-0 print:border-none print:max-h-none print:overflow-visible">
            
            {/* Action Bar (hidden during print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Printable Clinical Invoice</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button onClick={() => setInvoiceOrder(null)} className="p-2 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Pristine Pure White Printable Invoice Container */}
            <div id="printable-invoice" className="p-6 bg-white text-slate-900 space-y-6 border border-slate-200 rounded-2xl">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden p-0.5 border border-slate-200 flex items-center justify-center">
                    <img src="/logo.png" alt="MykoTech Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-950 leading-none">MYKOTECH PHARMA PVT LTD</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Live long Live Happy!</p>
                    <p className="text-[10px] text-slate-500">NTN: {settings.ntn_number} &bull; DRAP Reg: {settings.license_number}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-blue-700">{invoiceOrder.order_number}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Date: {new Date(invoiceOrder.created_at).toLocaleDateString()}
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase text-slate-700">
                    Status: {invoiceOrder.status}
                  </span>
                </div>
              </div>

              {/* Bill To & Dispatch Address */}
              <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-5">
                <div className="space-y-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Customer Information</span>
                  <div className="font-extrabold text-slate-900 text-sm">{invoiceOrder.customer_name}</div>
                  <div className="text-slate-600">Phone: {invoiceOrder.customer_phone}</div>
                  <div className="text-slate-600">{invoiceOrder.customer_email || 'No Email Provided'}</div>
                  <div className="text-slate-700 mt-1 font-medium">{invoiceOrder.delivery_address}, {invoiceOrder.city}</div>
                </div>

                <div className="space-y-1 text-right">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Dispatch Warehouse</span>
                  <div className="font-bold text-slate-800">{settings.warehouse_address}</div>
                  <div className="text-slate-600">Helpline: {settings.helpline_phone}</div>
                  <div className="text-slate-600">WhatsApp: {settings.whatsapp_number}</div>
                  <div className="text-slate-600">Email: {settings.support_email}</div>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 font-black text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(invoiceOrder.order_items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.product_name}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">Rs. {Number(item.unit_price).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">Rs. {Number(item.total_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Breakdown */}
              <div className="border-t border-slate-200 pt-4 flex justify-between items-start text-xs">
                <div className="max-w-xs space-y-1 text-slate-500 text-[11px]">
                  <p className="font-bold text-slate-700">Payment Mode: {invoiceOrder.payment_method.toUpperCase()}</p>
                  <p>Certified medicines packed in temperature-controlled sealed pouches.</p>
                </div>

                <div className="w-56 space-y-1.5 text-right">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold">Rs. {Number(invoiceOrder.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-950 border-t border-slate-200 pt-2">
                    <span>Grand Total:</span>
                    <span className="text-blue-700">Rs. {Number(invoiceOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Policies */}
              <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500 space-y-0.5">
                <p>Thank you for choosing MykoTech Pharma Pvt Ltd. For inquiries, contact 0318-4008718.</p>
                <p>This is a computer-generated official pharmaceutical dispatch invoice.</p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 6: PRESCRIPTION PREVIEW ZOOM
      ------------------------------------------------------------- */}
      {previewPrescription && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">{previewPrescription.patient_name}</h3>
                <span className="text-xs text-blue-600 font-bold">Contact: {previewPrescription.phone}</span>
              </div>
              <button onClick={() => setPreviewPrescription(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto rounded-xl bg-slate-100 flex items-center justify-center p-2">
              <img src={previewPrescription.image_url} alt="Prescription full" className="w-full h-auto object-contain" />
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-slate-500">{previewPrescription.notes}</span>
              <button
                onClick={() => setPreviewPrescription(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 7: CUTE MODERN DELETE CONFIRMATION POPUP (Zero Browser Localhost Alerts)
      ------------------------------------------------------------- */}
      {deleteModal && deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl text-center border border-rose-100 animate-in zoom-in-95 duration-150">
            
            {/* Cute Animated Trash Badge */}
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border-2 border-rose-100 flex items-center justify-center mx-auto text-rose-500 shadow-inner">
              <Trash2 className="w-8 h-8 animate-pulse text-rose-500" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">
                {deleteModal.title || 'Delete Confirmation'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Are you sure you want to delete{' '}
                <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block my-1">
                  "{deleteModal.itemName}"
                </span>
                ? This action will permanently remove it from the cloud database.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={async () => {
                  try {
                    setDeleteModal((prev) => (prev ? { ...prev, isDeleting: true } : null));
                    await deleteModal.onConfirm();
                    setDeleteModal(null);
                  } catch (err: any) {
                    setDeleteModal(null);
                    triggerError(err.message || 'Deletion failed');
                  }
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {deleteModal.isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
