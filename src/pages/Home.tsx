import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Search, ShoppingBag, MessageCircle, MapPin, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ImageCarousel = ({ images, alt, category }: { images: string[], alt: string, category: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openLightbox = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLightboxOpen(true);
  };

  const closeLightbox = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLightboxOpen(false);
  };

  return (
    <>
      <div 
        className="aspect-square bg-gray-100 relative overflow-hidden group/carousel cursor-pointer" 
        onClick={openLightbox}
        role="button"
        tabIndex={0}
        aria-label={`View gallery for ${alt}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsLightboxOpen(true);
          }
        }}
      >
        <img 
          src={images[currentIndex]} 
          alt={`${alt} - Image ${currentIndex + 1}`} 
          className="w-full h-full object-cover group-hover/carousel:scale-105 transition-transform duration-300" 
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 shadow-sm z-10">
          {category}
        </div>
        
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 transition-opacity z-10 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 transition-opacity z-10 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeLightbox}>
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full transition-colors z-50"
            onClick={closeLightbox}
            aria-label="Close gallery"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <img 
            src={images[currentIndex]} 
            alt={`${alt} - Full view ${currentIndex + 1}`} 
            className="max-w-full max-h-[90vh] object-contain" 
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                aria-label="Previous image"
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-50"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
              <button
                onClick={nextImage}
                aria-label="Next image"
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-50"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-50">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                    aria-label={`Go to image ${idx + 1}`}
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${
                      idx === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const categories = ['Semua', 'Sayur', 'Sembako', 'Minuman', 'Snack', 'Lainnya'];

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleWhatsAppClick = (product: any) => {
    const message = `Halo ${product.sellerName}, saya tertarik dengan produk *${product.name}* (Rp ${product.price.toLocaleString('id-ID')}) yang Anda jual di PasarDesa. Apakah masih tersedia?`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${product.sellerWhatsapp}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="bg-emerald-600 rounded-3xl p-8 sm:p-12 mb-12 text-center text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">PasarDesa Digital</h1>
          <p className="text-lg sm:text-xl text-emerald-100 mb-8">
            Dukung ekonomi lokal. Beli kebutuhan sehari-hari langsung dari tetangga dan petani desa Anda.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 border-transparent rounded-2xl leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-400/50 shadow-sm transition-all text-lg"
              placeholder="Cari sayur, sembako, atau snack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            Kategori Produk
          </h2>
        </div>
        <div className="flex overflow-x-auto pb-4 gap-3 hide-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded-xl w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Produk tidak ditemukan</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Maaf, kami tidak dapat menemukan produk yang sesuai dengan pencarian atau kategori yang Anda pilih.
          </p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCategory('Semua'); }}
            className="mt-6 text-emerald-600 font-medium hover:text-emerald-700"
          >
            Lihat semua produk
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => {
            const images = product.images?.length > 0 ? product.images : [product.imageUrl || 'https://picsum.photos/seed/placeholder/400/300'];
            return (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col">
              <ImageCarousel images={images} alt={product.name} category={product.category} />
              
              <Link to={`/product/${product.id}`} className="p-4 sm:p-5 flex flex-col flex-grow cursor-pointer">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-emerald-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-lg font-extrabold text-emerald-600 mb-3">
                  Rp {product.price.toLocaleString('id-ID')}
                </p>
                
                <div className="mt-auto pt-3 border-t border-gray-50 mb-4">
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <Store className="w-3.5 h-3.5 mr-1.5" />
                    <span className="truncate">{product.sellerName}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    <span>Desa Kita</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleWhatsAppClick(product);
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-green-200"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Pesan WA</span>
                </button>
              </Link>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
