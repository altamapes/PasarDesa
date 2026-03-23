import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { MapPin, Navigation, Store } from 'lucide-react';

// Haversine formula to calculate distance between two coordinates in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default function CourierCalculator() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courierLocation, setCourierLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Only get sellers who have set their location
      const sellersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((user: any) => user.latitude && user.longitude);
      setSellers(sellersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCourierLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        console.error('Error mendapatkan lokasi:', error);
        alert('Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.');
        setIsLocating(false);
      }
    );
  };

  const distance = courierLocation && selectedSeller
    ? calculateDistance(courierLocation.lat, courierLocation.lng, selectedSeller.latitude, selectedSeller.longitude).toFixed(2)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Navigation className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Kalkulator Jarak Kurir</h1>
        <p className="text-gray-500 text-lg">
          Hitung jarak dari lokasi Anda saat ini ke toko penjual untuk estimasi pengiriman.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Step 1: Courier Location */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
            Lokasi Anda
          </h2>
          
          {courierLocation ? (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
              <p className="text-blue-800 font-medium flex items-center mb-1">
                <MapPin className="w-4 h-4 mr-2" />
                Lokasi berhasil didapatkan
              </p>
              <p className="text-sm text-blue-600">
                Lat: {courierLocation.lat.toFixed(6)}<br />
                Lng: {courierLocation.lng.toFixed(6)}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 mb-6">
              Izinkan akses lokasi untuk menghitung jarak secara akurat.
            </p>
          )}

          <button
            onClick={handleGetLocation}
            disabled={isLocating}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Navigation className="w-5 h-5" />
            <span>{isLocating ? 'Mencari Lokasi...' : (courierLocation ? 'Perbarui Lokasi Saya' : 'Dapatkan Lokasi Saya')}</span>
          </button>
        </div>

        {/* Step 2: Select Seller */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
            Pilih Toko Tujuan
          </h2>
          
          {loading ? (
            <p className="text-gray-500">Memuat daftar toko...</p>
          ) : sellers.length === 0 ? (
            <p className="text-gray-500">Belum ada toko yang mengatur lokasi mereka.</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {sellers.map((seller) => (
                <button
                  key={seller.id}
                  onClick={() => setSelectedSeller(seller)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedSeller?.id === seller.id
                      ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${selectedSeller?.id === seller.id ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{seller.name}</h3>
                      <p className="text-sm text-gray-500">WA: {seller.whatsapp}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      {courierLocation && selectedSeller && (
        <div className="bg-emerald-600 text-white p-8 rounded-2xl shadow-lg text-center mt-8 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-xl font-medium mb-2 opacity-90">Jarak Estimasi ke {selectedSeller.name}</h3>
          <div className="text-6xl font-bold mb-4">
            {distance} <span className="text-3xl font-medium opacity-80">km</span>
          </div>
          <p className="opacity-80">
            Jarak ini adalah garis lurus (Haversine). Jarak tempuh aktual melalui jalan raya mungkin lebih jauh.
          </p>
        </div>
      )}
    </div>
  );
}
