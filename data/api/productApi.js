import { apiClient } from '../apiClient';

export const fetchProducts = async () => {
  try {
    const response = await apiClient.get('/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const fetchUserProducts = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}/products`);
    return response.data;
  } catch (error) {
    console.error('Kullanici urunleri alinamadi:', error);
    return [];
  }
};

export const fetchCategories = async () => {
  try {
    const response = await apiClient.get('/categories');
    return response.data;
  } catch (error) {
    console.error('Kategoriler alinamadi:', error);
    return [];
  }
};

export const fetchModels = async () => {
  try {
    const response = await apiClient.get('/models');
    return response.data;
  } catch (error) {
    console.error('Modeller alinamadi:', error);
    return [];
  }
};

export const fetchBrands = async () => {
  try {
    const response = await apiClient.get('/brands');
    return response.data;
  } catch (error) {
    console.error('Markalar alinamadi:', error);
    return [];
  }
};

export const addProduct = async (product) => {
  try {
    const response = await apiClient.post('/products', product);
    return response.data;
  } catch (error) {
    console.error('Urun eklenemedi:', error);
    return null;
  }
};

export const updateProduct = async (productId, update) => {
  try {
    const response = await apiClient.put(`/products/${productId}`, update);
    return response.data;
  } catch (error) {
    console.error('Urun guncellenemedi:', error);
    return null;
  }
};

export const deleteProduct = async (productId) => {
  try {
    const response = await apiClient.delete(`/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Urun silinemedi:', error);
    return null;
  }
};

export const deleteProductById = deleteProduct;

export const updateProductInventory = async (productId, inventory) => updateProduct(productId, inventory);

export const addCategory = async (category) => {
  try {
    const response = await apiClient.post('/categories', category);
    return response.data;
  } catch (error) {
    console.error('Kategori eklenemedi:', error);
    return null;
  }
};

export const addModel = async (model) => {
  try {
    const response = await apiClient.post('/models', model);
    return response.data;
  } catch (error) {
    console.error('Model eklenemedi:', error);
    return null;
  }
};

export const addBrand = async (brand) => {
  try {
    const response = await apiClient.post('/brands', brand);
    return response.data;
  } catch (error) {
    console.error('Marka eklenemedi:', error);
    return null;
  }
};

export const fetchProductById = async (productId) => {
  try {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Urun alinamadi:', error);
    return null;
  }
};

export const fetchCategoryById = async (categoryId) => {
  try {
    const response = await apiClient.get(`/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error('Kategori alinamadi:', error);
    return null;
  }
};

export const fetchModelById = async (modelId) => {
  try {
    const response = await apiClient.get(`/models/${modelId}`);
    return response.data;
  } catch (error) {
    console.error('Model alinamadi:', error);
    return null;
  }
};

export const fetchBrandById = async (brandId) => {
  try {
    const response = await apiClient.get(`/brands/${brandId}`);
    return response.data;
  } catch (error) {
    console.error('Marka alinamadi:', error);
    return null;
  }
};
