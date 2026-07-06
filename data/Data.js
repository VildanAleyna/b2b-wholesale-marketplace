import axios from 'axios';
import { Platform } from 'react-native';

const getDefaultApiUrl = () => {
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000';
    }

    return 'http://localhost:3000';
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl();

export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

// Ürünleri almak için fonksiyon
export const fetchProducts = async () => {
    try {
        const response = await apiClient.get('/products');
        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};
  
// Kullanıcının ürünlerini almak için fonksiyon
export const fetchUserProducts = async (userId) => {
    try {
        const response = await apiClient.get(`/users/${userId}/products`);
        return response.data;
    } catch (error) {
        console.error('Kullanıcının ürünleri alınamadı:', error);
        return [];
    }
};


// Kategorileri almak için fonksiyon
export const fetchCategories = async () => {
    try {
        const response = await apiClient.get('/categories');
        return response.data;
    } catch (error) {
        console.error('Kategoriler alınamadı:', error);
        return [];
    }
};

// Modelleri almak için fonksiyon
export const fetchModels = async () => {
    try {
        const response = await apiClient.get('/models');
        return response.data;
    } catch (error) {
        console.error('Modeller alınamadı:', error);
        return [];
    }
};

// Markaları almak için fonksiyon
export const fetchBrands = async () => {
    try {
        const response = await apiClient.get('/brands');
        return response.data;
    } catch (error) {
        console.error('Markalar alınamadı:', error);
        return [];
    }
};

// Yeni ürün eklemek için fonksiyon
export const addProduct = async (product) => {
    try {
        const response = await apiClient.post('/products', product);
        return response.data;
    } catch (error) {
        console.error('Ürün eklenemedi:', error);
        return null;
    }
};

// Ürünü güncellemek için fonksiyon
export const updateProduct = async (productId, update) => {
    try {
        const response = await apiClient.put(`/products/${productId}`, update);
        return response.data;
    } catch (error) {
        console.error('Ürün güncellenemedi:', error);
        return null;
    }
};

// Ürünü silmek için fonksiyon
export const deleteProduct = async (productId) => {
    try {
        const response = await apiClient.delete(`/products/${productId}`);
        return response.data;
    } catch (error) {
        console.error('Ürün silinemedi:', error);
        return null;
    }
};

export const deleteProductById = deleteProduct;

export const updateProductInventory = async (productId, inventory) => {
    return updateProduct(productId, inventory);
};

// Kategori eklemek için fonksiyon
export const addCategory = async (category) => {
    try {
        const response = await apiClient.post('/categories', category);
        return response.data;
    } catch (error) {
        console.error('Kategori eklenemedi:', error);
        return null;
    }
};

// Model eklemek için fonksiyon
export const addModel = async (model) => {
    try {
        const response = await apiClient.post('/models', model);
        return response.data;
    } catch (error) {
        console.error('Model eklenemedi:', error);
        return null;
    }
};

// Marka eklemek için fonksiyon
export const addBrand = async (brand) => {
    try {
        const response = await apiClient.post('/brands', brand);
        return response.data;
    } catch (error) {
        console.error('Marka eklenemedi:', error);
        return null;
    }
};

// Belirli bir ürünü ID ile almak için fonksiyon
export const fetchProductById = async (productId) => {
    try {
        const response = await apiClient.get(`/products/${productId}`);
        return response.data;
    } catch (error) {
        console.error('Ürün alınamadı:', error);
        return null;
    }
};

// Belirli bir kullanıcıyı ID ile almak için fonksiyon
export const fetchUserById = async (userId) => {
    try {
        const response = await apiClient.get(`/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Kullanıcı alınamadı:', error);
        return null;
    }
};

// Belirli bir kategoriyi ID ile almak için fonksiyon
export const fetchCategoryById = async (categoryId) => {
    try {
        const response = await apiClient.get(`/categories/${categoryId}`);
        return response.data;
    } catch (error) {
        console.error('Kategori alınamadı:', error);
        return null;
    }
};

// Belirli bir modeli ID ile almak için fonksiyon
export const fetchModelById = async (modelId) => {
    try {
        const response = await apiClient.get(`/models/${modelId}`);
        return response.data;
    } catch (error) {
        console.error('Model alınamadı:', error);
        return null;
    }
};

// Belirli bir markayı ID ile almak için fonksiyon
export const fetchBrandById = async (brandId) => {
    try {
        const response = await apiClient.get(`/brands/${brandId}`);
        return response.data;
    } catch (error) {
        console.error('Marka alınamadı:', error);
        return null;
    }
};
// Favori çıkarma fonksiyonu
export const removeFavorite = async (productId, user, setUser) => {
    if (user) {
        const updatedFavorites = user.favorites.filter(id => id !== productId); // Favoriyi listeden çıkarır
        setUser(prevState => ({ ...prevState, favorites: updatedFavorites })); // State'i günceller

        try {
            // Favorileri veritabanından sil
            const response = await apiClient.put(`/users/${user._id}/favorites/remove`, {
                productId: productId,
            });

            if (response.status !== 200) {
                throw new Error('Favorileri silme hatası');
            }

        } catch (error) {
            console.error("Favorileri silme hatası:", error); // Favorileri kaydederken hata oluşursa, konsola hata mesajı yazar
        }
    }
};

export const addFavorite = async (productId, user, setUser) => {
    if (user) {
        const updatedFavorites = [...user.favorites, productId]; // Yeni favoriyi mevcut favorilere ekler
        setUser(prevState => ({ ...prevState, favorites: updatedFavorites })); // State'i günceller

        try {
            // Favorileri veritabanına kaydet
            const response = await apiClient.put(`/users/${user._id}/favorites/add`, {
                productId: productId,
            });

            if (response.status !== 200) {
                throw new Error('Favorileri kaydetme hatası');
            }

        } catch (error) {
            console.error("Favorileri kaydetme hatası:", error); // Favorileri kaydederken hata oluşursa, konsola hata mesajı yazar
        }
    }
};
// Favori ürünleri alma fonksiyonu
export const fetchFavoriteProducts = async (userId) => {
    try {
        const response = await apiClient.get(`/users/${userId}/favorites`);
        return response.data; // API'den gelen verinin doğru formatta olduğunu doğrulayın
    } catch (error) {
        console.error('Favori ürünler alınamadı:', error);
        return []; // Hata durumunda boş bir dizi döndür
    }
};

// Toptancı detaylarını alma fonksiyonu
export const fetchWholesalerDetails = async (wholesalerId) => {
    try {
        const response = await apiClient.get(`/wholesalers/${wholesalerId}`);
        return response.data;
    } catch (error) {
        console.error('Toptancı bilgileri alınamadı:', error);
        return null;
    }
};

// Kullanıcının cari hesaplarını alma fonksiyonu
export const fetchUserCariAccounts = async (userId) => {
    try {
        const response = await apiClient.get(`/users/${userId}/accounts`);
        return response.data;
    } catch (error) {
        console.error('Cari hesaplar alınamadı:', error);
        return [];
    }
};

export const fetchWholesalerAccounts = async (wholesalerId) => {
    try {
        const response = await apiClient.get(`/wholesalers/${wholesalerId}/accounts`);
        return response.data;
    } catch (error) {
        console.error('Bayi cari hesapları alınamadı:', error);
        return [];
    }
};

// Ödeme bildirimi gönderme fonksiyonu (Bayi)
export const submitPaymentNotification = async (customerId, wholesalerId, amount, receiptFile) => {
    try {
        const response = await apiClient.post('/payments/notify', {
            customerId,
            wholesalerId,
            amount,
            receiptFile
        });
        return response.data;
    } catch (error) {
        console.error('Ödeme bildirimi gönderilemedi:', error);
        return null;
    }
};

// Toptancıya gelen ödeme bildirimlerini alma fonksiyonu
export const fetchWholesalerPayments = async (wholesalerId) => {
    try {
        const response = await apiClient.get(`/wholesalers/${wholesalerId}/payments`);
        return response.data;
    } catch (error) {
        console.error('Ödeme bildirimleri alınamadı:', error);
        return [];
    }
};

// Ödeme bildirimi durumunu güncelleme (Onaylama / Reddetme)
export const updatePaymentStatus = async (paymentId, status) => {
    try {
        const response = await apiClient.put(`/payments/${paymentId}/status`, { status });
        return response.data;
    } catch (error) {
        console.error('Ödeme durumu güncellenemedi:', error);
        return null;
    }
};

// Sipariş gönderme fonksiyonu (Bayi Satın Alması)
export const submitPurchase = async (userId, purchaseDetails) => {
    try {
        const response = await apiClient.post(`/users/${userId}/purchase`, purchaseDetails);
        return response.data;
    } catch (error) {
        console.error('Sipariş gönderilemedi:', error);
        throw error;
    }
};

// Kullanıcının sipariş geçmişini alma fonksiyonu
export const fetchUserOrders = async (userId) => {
    try {
        const response = await apiClient.get(`/users/${userId}/orders`);
        return response.data;
    } catch (error) {
        console.error('Siparişler alınamadı:', error);
        return [];
    }
};

// Kullanıcının cari hesap ekstre dökümünü alma
export const fetchUserStatement = async (userId) => {
    try {
        const response = await apiClient.get(`/users/${userId}/statement`);
        return response.data;
    } catch (error) {
        console.error('Cari ekstre dökümü alınamadı:', error);
        return [];
    }
};

// Toptancıya ait gelen siparişleri alma
export const fetchWholesalerOrders = async (wholesalerId) => {
    try {
        const response = await apiClient.get(`/wholesalers/${wholesalerId}/orders`);
        return response.data;
    } catch (error) {
        console.error('Gelen siparişler alınamadı:', error);
        return [];
    }
};

// Sipariş kargo durumunu ve takip kodunu güncelleme
export const updateOrderStatus = async (customerId, orderId, status, trackingNumber) => {
    try {
        const response = await apiClient.put(`/customers/${customerId}/orders/${orderId}/status`, {
            status,
            trackingNumber
        });
        return response.data;
    } catch (error) {
        console.error('Sipariş durumu güncellenemedi:', error);
        return null;
    }
};

// Bayinin siparişe istinaden toptancıyı puanlaması
export const submitOrderRating = async (customerId, orderId, rating, review) => {
    try {
        const response = await apiClient.put(`/customers/${customerId}/orders/${orderId}/rate`, {
            rating,
            review
        });
        return response.data;
    } catch (error) {
        console.error('Toptancı değerlendirmesi gönderilemedi:', error);
        return null;
    }
};

// Bayinin profil detaylarını güncelleme
export const updateUserProfile = async (userId, profileDetails) => {
    try {
        const response = await apiClient.put(`/users/${userId}/profile`, profileDetails);
        return response.data;
    } catch (error) {
        console.error('Profil güncellenemedi:', error);
        return null;
    }
};

// Toptancı ayarlarını güncelleme
export const updateUserSettings = async (userId, settingsDetails) => {
    try {
        const response = await apiClient.put(`/users/${userId}/settings`, settingsDetails);
        return response.data;
    } catch (error) {
        console.error('Ayarlar güncellenemedi:', error);
        return null;
    }
};

// Toptancı Personel Yönetimi APIs
export const fetchEmployees = async (wholesalerId) => {
    try {
        const response = await apiClient.get(`/wholesalers/${wholesalerId}/employees`);
        return response.data;
    } catch (error) {
        console.error('Personel listesi alınamadı:', error);
        return null;
    }
};

export const addEmployee = async (wholesalerId, employeeData) => {
    const response = await apiClient.post(`/wholesalers/${wholesalerId}/employees`, employeeData);
    return response.data;
};

export const deleteEmployee = async (wholesalerId, employeeName) => {
    const response = await apiClient.delete(`/wholesalers/${wholesalerId}/employees/${encodeURIComponent(employeeName)}`);
    return response.data;
};

export const registerUser = async (userData) => {
    const response = await apiClient.post('/register', userData);
    return response.data;
};

export const loginUser = async (email, password) => {
    const response = await apiClient.post('/login', { email, password });
    return response.data;
};
