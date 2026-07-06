import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL'sini tanımlayın
const API_URL = 'http://localhost:3000'; // Kendi bilgisayarınızın yerel IP'sini girin (örn: 'http://192.168.1.100:3000')

// Ürünleri almak için fonksiyon
export const fetchProducts = async () => {
    try {
        const response = await axios.get(`${API_URL}/products`);
        console.log('Fetched products:', response.data); // Verileri kontrol etmek için log ekliyoruz
        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};
  
// Kullanıcının ürünlerini almak için fonksiyon
export const fetchUserProducts = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/users/${userId}/products`);
        return response.data;
    } catch (error) {
        console.error('Kullanıcının ürünleri alınamadı:', error);
        return [];
    }
};


// Kullanıcıları almak için fonksiyon
export const fetchUsers = async () => {
    try {
        const response = await axios.get(`${API_URL}/users`);
        return response.data;
    } catch (error) {
        console.error('Kullanıcılar alınamadı:', error);
        return [];
    }
};

// Kategorileri almak için fonksiyon
export const fetchCategories = async () => {
    try {
        const response = await axios.get(`${API_URL}/categories`);
        return response.data;
    } catch (error) {
        console.error('Kategoriler alınamadı:', error);
        return [];
    }
};

// Modelleri almak için fonksiyon
export const fetchModels = async () => {
    try {
        const response = await axios.get(`${API_URL}/models`);
        return response.data;
    } catch (error) {
        console.error('Modeller alınamadı:', error);
        return [];
    }
};

// Markaları almak için fonksiyon
export const fetchBrands = async () => {
    try {
        const response = await axios.get(`${API_URL}/brands`);
        return response.data;
    } catch (error) {
        console.error('Markalar alınamadı:', error);
        return [];
    }
};

// Yeni ürün eklemek için fonksiyon
export const addProduct = async (product) => {
    try {
        const response = await axios.post(`${API_URL}/products`, product);
        return response.data;
    } catch (error) {
        console.error('Ürün eklenemedi:', error);
        return null;
    }
};

// Ürünü güncellemek için fonksiyon
export const updateProduct = async (productId, update) => {
    try {
        const response = await axios.put(`${API_URL}/products/${productId}`, update);
        return response.data;
    } catch (error) {
        console.error('Ürün güncellenemedi:', error);
        return null;
    }
};

// Ürünü silmek için fonksiyon
export const deleteProduct = async (productId) => {
    try {
        const response = await axios.delete(`${API_URL}/products/${productId}`);
        return response.data;
    } catch (error) {
        console.error('Ürün silinemedi:', error);
        return null;
    }
};

// Kategori eklemek için fonksiyon
export const addCategory = async (category) => {
    try {
        const response = await axios.post(`${API_URL}/categories`, category);
        return response.data;
    } catch (error) {
        console.error('Kategori eklenemedi:', error);
        return null;
    }
};

// Model eklemek için fonksiyon
export const addModel = async (model) => {
    try {
        const response = await axios.post(`${API_URL}/models`, model);
        return response.data;
    } catch (error) {
        console.error('Model eklenemedi:', error);
        return null;
    }
};

// Marka eklemek için fonksiyon
export const addBrand = async (brand) => {
    try {
        const response = await axios.post(`${API_URL}/brands`, brand);
        return response.data;
    } catch (error) {
        console.error('Marka eklenemedi:', error);
        return null;
    }
};

// Belirli bir ürünü ID ile almak için fonksiyon
export const fetchProductById = async (productId) => {
    try {
        const response = await axios.get(`${API_URL}/products/${productId}`);
        return response.data;
    } catch (error) {
        console.error('Ürün alınamadı:', error);
        return null;
    }
};

// Belirli bir kullanıcıyı ID ile almak için fonksiyon
export const fetchUserById = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Kullanıcı alınamadı:', error);
        return null;
    }
};

// Belirli bir kategoriyi ID ile almak için fonksiyon
export const fetchCategoryById = async (categoryId) => {
    try {
        const response = await axios.get(`${API_URL}/categories/${categoryId}`);
        return response.data;
    } catch (error) {
        console.error('Kategori alınamadı:', error);
        return null;
    }
};

// Belirli bir modeli ID ile almak için fonksiyon
export const fetchModelById = async (modelId) => {
    try {
        const response = await axios.get(`${API_URL}/models/${modelId}`);
        return response.data;
    } catch (error) {
        console.error('Model alınamadı:', error);
        return null;
    }
};

// Belirli bir markayı ID ile almak için fonksiyon
export const fetchBrandById = async (brandId) => {
    try {
        const response = await axios.get(`${API_URL}/brands/${brandId}`);
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
            const response = await axios.put(`${API_URL}/users/${user._id}/favorites/remove`, {
                productId: productId,
            });

            if (response.status !== 200) {
                throw new Error('Favorileri silme hatası');
            }

            await AsyncStorage.setItem('user', JSON.stringify({ ...user, favorites: updatedFavorites })); // Güncellenmiş favorileri AsyncStorage'a kaydeder
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
            const response = await axios.put(`${API_URL}/users/${user._id}/favorites/add`, {
                productId: productId,
            });

            if (response.status !== 200) {
                throw new Error('Favorileri kaydetme hatası');
            }

            await AsyncStorage.setItem('user', JSON.stringify({ ...user, favorites: updatedFavorites })); // Güncellenmiş favorileri AsyncStorage'a kaydeder
        } catch (error) {
            console.error("Favorileri kaydetme hatası:", error); // Favorileri kaydederken hata oluşursa, konsola hata mesajı yazar
        }
    }
};
// Favori ürünleri alma fonksiyonu
export const fetchFavoriteProducts = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/users/${userId}/favorites`);
        return response.data; // API'den gelen verinin doğru formatta olduğunu doğrulayın
    } catch (error) {
        console.error('Favori ürünler alınamadı:', error);
        Alert.alert('Hata', 'Favori ürünler yüklenirken bir hata oluştu.');
        return []; // Hata durumunda boş bir dizi döndür
    }
};