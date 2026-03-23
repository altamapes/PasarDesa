import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, MessageCircle, Store, MapPin, Star, Send } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProduct(null);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `products/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    const q = query(collection(db, 'products', id, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `products/${id}/reviews`);
    });

    return () => unsubscribe();
  }, [id]);

  const handleWhatsAppClick = () => {
    if (!product) return;
    const message = `Halo ${product.sellerName}, saya tertarik dengan produk *${product.name}* (Rp ${product.price.toLocaleString('id-ID')}) yang Anda jual di PasarDesa. Apakah masih tersedia?`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${product.sellerWhatsapp}?text=${encodedMessage}`, '_blank');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newReview.trim()) return;

    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'products', id, 'reviews'), {
        userId: user.uid,
        userName: user.displayName || 'Pengguna',
        rating,
        text: newReview.trim(),
        createdAt: serverTimestamp()
      });
      setNewReview('');
      setRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${id}/reviews`);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Produk tidak ditemukan</h2>
        <button onClick={() => navigate('/')} className="text-emerald-600 hover:underline">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [product.imageUrl || 'https://picsum.photos/seed/placeholder/800/600'];
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Kembali
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Section */}
          <div className="bg-gray-100 aspect-square md:aspect-auto">
            <img 
              src={images[0]} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Details Section */}
          <div className="p-6 sm:p-8 flex flex-col">
            <div className="mb-2 inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium w-max">
              {product.category}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            <p className="text-3xl font-extrabold text-emerald-600 mb-6">
              Rp {product.price.toLocaleString('id-ID')}
            </p>

            <div className="prose prose-emerald mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deskripsi</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mr-4">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{product.sellerName}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      Desa Kita
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleWhatsAppClick}
                className="w-full flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-4 rounded-xl font-bold text-lg transition-colors shadow-sm shadow-green-200"
              >
                <MessageCircle className="w-6 h-6" />
                <span>Hubungi Penjual (WhatsApp)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Ulasan Produk</h2>
          {reviews.length > 0 && (
            <div className="flex items-center bg-yellow-50 px-3 py-1.5 rounded-lg">
              <Star className="w-5 h-5 text-yellow-500 fill-current mr-2" />
              <span className="font-bold text-yellow-700 text-lg">{averageRating}</span>
              <span className="text-yellow-600 ml-1 text-sm">({reviews.length})</span>
            </div>
          )}
        </div>

        {/* Add Review Form */}
        {user ? (
          <form onSubmit={handleSubmitReview} className="mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Tulis Ulasan Anda</h3>
            <div className="flex items-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none"
                >
                  <Star 
                    className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                </button>
              ))}
            </div>
            <div className="relative">
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Bagaimana kualitas produk ini?"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[100px] resize-y"
                required
              />
              <button
                type="submit"
                disabled={submittingReview || !newReview.trim()}
                className="absolute bottom-3 right-3 bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
            <p className="text-gray-600 mb-4">Silakan masuk untuk menulis ulasan.</p>
            <button 
              onClick={() => navigate('/login')}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Masuk
            </button>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Belum ada ulasan untuk produk ini. Jadilah yang pertama!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-900">{review.userName}</div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600">{review.text}</p>
                {review.createdAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    {review.createdAt.toDate().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
