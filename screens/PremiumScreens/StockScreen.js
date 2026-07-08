import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  deleteProductById,
  addProduct,
  fetchBrands,
  fetchCategories,
  fetchBrandById,
  fetchCategoryById,
  fetchModelById,
  fetchModels,
  fetchUserProducts,
  updateProductInventory,
} from '../../data/Data';
import { AuthContext } from '../../context/AuthContext';
import { getResponsiveContentWidth, isWeb } from '../../constants/responsiveLayout';
import { CARD_STYLES, COLORS, FONT_FAMILY } from '../../constants/uiTheme';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import SummaryMetricCard from '../../components/ui/SummaryMetricCard';

const formatPrice = (value) => {
  const numericValue = Number(value || 0);
  return `${numericValue.toLocaleString('tr-TR')} ₺`;
};

const getProductPrice = (product) => product?.wholesalers?.[0]?.price || 0;
const getProductStock = (product) => product?.wholesalers?.[0]?.stockQuantity || 0;
const getProductMinStock = (product) => product?.wholesalers?.[0]?.minStockLevel || 0;

const StockScreen = () => {
  const { user } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 900;
  const webContentWidth = getResponsiveContentWidth(width, 1100);

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState({});
  const [models, setModels] = useState({});
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draftInventory, setDraftInventory] = useState({});
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [catalogOptions, setCatalogOptions] = useState({ categories: [], models: [], brands: [] });
  const [newProduct, setNewProduct] = useState({
    title: '',
    image: '',
    categoryId: '',
    modelId: '',
    brandId: '',
    price: '',
    stockQuantity: '',
    minStockLevel: '',
    description: '',
  });

  const loadProducts = async () => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await fetchUserProducts(user._id);
      const safeData = Array.isArray(data) ? data : [];
      setProducts(safeData);

      const brandIds = [...new Set(safeData.map(product => product.brandId).filter(Boolean))];
      const categoryIds = [...new Set(safeData.map(product => product.categoryId).filter(Boolean))];
      const modelIds = [...new Set(safeData.map(product => product.modelId).filter(Boolean))];

      const [brandData, categoryData, modelData] = await Promise.all([
        Promise.all(brandIds.map(id => fetchBrandById(id))),
        Promise.all(categoryIds.map(id => fetchCategoryById(id))),
        Promise.all(modelIds.map(id => fetchModelById(id))),
      ]);

      setBrands(brandData.filter(Boolean).reduce((map, brand) => ({ ...map, [brand._id]: brand }), {}));
      setCategories(categoryData.filter(Boolean).reduce((map, category) => ({ ...map, [category._id]: category }), {}));
      setModels(modelData.filter(Boolean).reduce((map, model) => ({ ...map, [model._id]: model }), {}));

      setDraftInventory(safeData.reduce((acc, product) => ({
        ...acc,
        [product._id]: {
          price: String(getProductPrice(product)),
          stockQuantity: String(getProductStock(product)),
          minStockLevel: String(getProductMinStock(product)),
        },
      }), {}));
    } catch (err) {
      console.error('Ürünler alınamadı:', err);
      setError('Stok listesi alınamadı. API bağlantısını ve toptancı hesabını kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [user?._id])
  );

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProductById(productId);
      setProducts(prevProducts => prevProducts.filter(product => product._id !== productId));
      setDraftInventory(({ [productId]: removed, ...rest }) => rest);
    } catch (err) {
      Alert.alert('Hata', 'Ürün silinirken bir hata oluştu.');
    }
  };

  const handleInventoryChange = (productId, field, value) => {
    const normalizedValue = value.replace(/[^0-9.]/g, '');
    setDraftInventory(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: normalizedValue,
      },
    }));
  };

  const handleSavePrices = async () => {
    setSaving(true);
    try {
      await Promise.all(Object.keys(draftInventory).map(productId => (
        updateProductInventory(productId, {
          price: Number(draftInventory[productId]?.price || 0),
          stockQuantity: Number(draftInventory[productId]?.stockQuantity || 0),
          minStockLevel: Number(draftInventory[productId]?.minStockLevel || 0),
        })
      )));

      setProducts(prevProducts => prevProducts.map(product => ({
        ...product,
        wholesalers: [{
          ...(product.wholesalers?.[0] || {}),
          price: Number(draftInventory[product._id]?.price || 0),
          stockQuantity: Number(draftInventory[product._id]?.stockQuantity || 0),
          minStockLevel: Number(draftInventory[product._id]?.minStockLevel || 0),
        }],
      })));

      Alert.alert('Başarılı', 'Stok, minimum stok ve fiyat bilgileri güncellendi.');
    } catch (err) {
      Alert.alert('Hata', 'Fiyat güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const loadCatalogOptions = async () => {
    const [categoryData, modelData, brandData] = await Promise.all([
      fetchCategories(),
      fetchModels(),
      fetchBrands(),
    ]);

    setCatalogOptions({
      categories: categoryData,
      models: modelData,
      brands: brandData,
    });

    setNewProduct(prev => ({
      ...prev,
      categoryId: prev.categoryId || categoryData[0]?._id || '',
      modelId: prev.modelId || modelData[0]?._id || '',
      brandId: prev.brandId || brandData[0]?._id || '',
    }));
  };

  const handleOpenAddModal = async () => {
    setAddModalVisible(true);
    try {
      await loadCatalogOptions();
    } catch (err) {
      Alert.alert('Hata', 'Kategori, model ve marka listeleri alınamadı.');
    }
  };

  const handleNewProductChange = (field, value) => {
    setNewProduct(prev => ({ ...prev, [field]: value }));
  };

  const resetNewProduct = () => {
    setNewProduct({
      title: '',
      image: '',
      categoryId: catalogOptions.categories[0]?._id || '',
      modelId: catalogOptions.models[0]?._id || '',
      brandId: catalogOptions.brands[0]?._id || '',
      price: '',
      stockQuantity: '',
      minStockLevel: '',
      description: '',
    });
  };

  const handleAddProduct = async () => {
    const requiredFields = ['title', 'image', 'categoryId', 'modelId', 'brandId', 'price', 'stockQuantity', 'minStockLevel'];
    const hasMissingField = requiredFields.some(field => !String(newProduct[field] || '').trim());

    if (hasMissingField) {
      Alert.alert('Eksik Bilgi', 'Lütfen ürün adı, görsel, kategori, model, marka, fiyat ve stok bilgilerini doldurun.');
      return;
    }

    const payload = {
      title: newProduct.title.trim(),
      categoryId: newProduct.categoryId,
      modelId: newProduct.modelId,
      brandId: newProduct.brandId,
      image: newProduct.image.trim(),
      wholesalers: [{
        usersID: user._id,
        name: user.wholesalerName || user.companyName || user.name,
        price: Number(newProduct.price || 0),
        stockQuantity: Number(newProduct.stockQuantity || 0),
        minStockLevel: Number(newProduct.minStockLevel || 0),
        description: newProduct.description.trim(),
      }],
    };

    try {
      const createdProduct = await addProduct(payload);
      if (!createdProduct) {
        Alert.alert('Hata', 'Ürün eklenemedi.');
        return;
      }

      setAddModalVisible(false);
      resetNewProduct();
      await loadProducts();
      Alert.alert('Başarılı', 'Yeni ürün stok listenize eklendi.');
    } catch (err) {
      Alert.alert('Hata', 'Ürün eklenirken bir sorun oluştu.');
    }
  };

  const totalStock = products.reduce((sum, product) => sum + getProductStock(product), 0);
  const lowStockCount = products.filter(product => (
    getProductStock(product) <= getProductMinStock(product)
  )).length;
  const totalInventoryValue = products.reduce((sum, product) => (
    sum + (Number(draftInventory[product._id]?.price || getProductPrice(product)) * Number(draftInventory[product._id]?.stockQuantity || getProductStock(product)))
  ), 0);

  const renderProduct = ({ item }) => {
    const stock = getProductStock(item);
    const minStock = getProductMinStock(item);
    const isLowStock = stock <= minStock;
    const draft = draftInventory[item._id] || {};

    return (
      <View style={styles.productCard}>
        <Image source={{ uri: item.image }} style={styles.productImage} />

        <View style={styles.productInfo}>
          <View style={styles.productTitleRow}>
            <Text style={styles.productTitle}>{item.title || 'Ürün adı yok'}</Text>
            {isLowStock ? (
              <View style={styles.warningBadge}>
                <Ionicons name="warning" size={12} color="#F97316" style={{ marginRight: 4 }} />
                <Text style={styles.warningBadgeText}>Kritik stok</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.productMeta}>
            {categories[item.categoryId]?.name || 'Kategori yok'} • {models[item.modelId]?.name || 'Model yok'} • {brands[item.brandId]?.name || 'Marka yok'}
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Mevcut Stok</Text>
              <TextInput
                value={draft.stockQuantity ?? String(stock)}
                onChangeText={(value) => handleInventoryChange(item._id, 'stockQuantity', value)}
                keyboardType="numeric"
                style={styles.metricInput}
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Minimum</Text>
              <TextInput
                value={draft.minStockLevel ?? String(minStock)}
                onChangeText={(value) => handleInventoryChange(item._id, 'minStockLevel', value)}
                keyboardType="numeric"
                style={styles.metricInput}
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.metricLabel}>Satış Fiyatı</Text>
              <TextInput
                value={draft.price || ''}
                onChangeText={(value) => handleInventoryChange(item._id, 'price', value)}
                keyboardType="numeric"
                style={styles.priceInput}
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProduct(item._id)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.centerText}>Stok listesi yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <PageHeader
          eyebrow="Toptancı Stok Paneli"
          title="Ürün ve Fiyat Yönetimi"
          subtitle="Ürünlerinizi, stok seviyelerinizi ve satış fiyatlarınızı buradan takip edin."
          style={[styles.headerRow, isLargeScreen && styles.headerRowLarge, isWeb && { width: webContentWidth }]}
          rightContent={(
            <View style={styles.headerActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenAddModal}>
              <Ionicons name="add-circle" size={17} color="#1E3A8A" style={{ marginRight: 7 }} />
              <Text style={styles.secondaryButtonText}>Yeni Ürün Ekle</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSavePrices} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save" size={17} color="#FFFFFF" style={{ marginRight: 7 }} />
                  <Text style={styles.saveButtonText}>Stokları Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
            </View>
          )}
        />

        <View style={[styles.summaryGrid, isWeb && { width: webContentWidth }]}>
          <SummaryMetricCard label="Ürün Çeşidi" value={products.length} hint="Satışta olan ürün kaydı" />
          <SummaryMetricCard label="Toplam Stok" value={totalStock} hint="Depodaki toplam adet" />
          <SummaryMetricCard label="Kritik Stok" value={lowStockCount} hint="Minimum seviyeye yaklaşan ürün" tone={lowStockCount > 0 ? 'warning' : 'primary'} />
          <SummaryMetricCard label="Stok Değeri" value={formatPrice(totalInventoryValue)} hint="Fiyat x stok yaklaşık değer" />
        </View>

        {error ? (
          <View style={styles.centerState}>
            <Ionicons name="alert-circle-outline" size={56} color="#EF4444" />
            <Text style={styles.centerTitle}>Liste alınamadı</Text>
            <Text style={styles.centerText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item._id}
            contentContainerStyle={[styles.listContent, isWeb && { width: webContentWidth }]}
            ListEmptyComponent={
              <EmptyState
                icon="cube-outline"
                title="Henüz ürün yok"
                subtitle="Toptancı hesabınıza ürün eklediğinizde stok listeniz burada görünecek."
              />
            }
          />
        )}
      </View>

      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Yeni Ürün Ekle</Text>
                <Text style={styles.modalSubtitle}>Toptancı stoğunuza yeni ürün tanımlayın.</Text>
              </View>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ürün Adı</Text>
                <TextInput
                  value={newProduct.title}
                  onChangeText={(value) => handleNewProductChange('title', value)}
                  style={styles.formInput}
                  placeholder="Örn: Stanley Termos 1.4 L"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Görsel URL</Text>
                <TextInput
                  value={newProduct.image}
                  onChangeText={(value) => handleNewProductChange('image', value)}
                  style={styles.formInput}
                  placeholder="https://..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.selectGrid}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Kategori</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {catalogOptions.categories.map((category) => (
                      <TouchableOpacity
                        key={category._id}
                        style={[styles.selectPill, newProduct.categoryId === category._id && styles.selectPillActive]}
                        onPress={() => handleNewProductChange('categoryId', category._id)}
                      >
                        <Text style={[styles.selectPillText, newProduct.categoryId === category._id && styles.selectPillTextActive]}>{category.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Model</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {catalogOptions.models.map((model) => (
                      <TouchableOpacity
                        key={model._id}
                        style={[styles.selectPill, newProduct.modelId === model._id && styles.selectPillActive]}
                        onPress={() => handleNewProductChange('modelId', model._id)}
                      >
                        <Text style={[styles.selectPillText, newProduct.modelId === model._id && styles.selectPillTextActive]}>{model.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Marka</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {catalogOptions.brands.map((brand) => (
                      <TouchableOpacity
                        key={brand._id}
                        style={[styles.selectPill, newProduct.brandId === brand._id && styles.selectPillActive]}
                        onPress={() => handleNewProductChange('brandId', brand._id)}
                      >
                        <Text style={[styles.selectPillText, newProduct.brandId === brand._id && styles.selectPillTextActive]}>{brand.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <Text style={styles.formLabel}>Satış Fiyatı</Text>
                  <TextInput
                    value={newProduct.price}
                    onChangeText={(value) => handleNewProductChange('price', value.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.formColumn}>
                  <Text style={styles.formLabel}>Mevcut Stok</Text>
                  <TextInput
                    value={newProduct.stockQuantity}
                    onChangeText={(value) => handleNewProductChange('stockQuantity', value.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.formColumn}>
                  <Text style={styles.formLabel}>Minimum Stok</Text>
                  <TextInput
                    value={newProduct.minStockLevel}
                    onChangeText={(value) => handleNewProductChange('minStockLevel', value.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Açıklama</Text>
                <TextInput
                  value={newProduct.description}
                  onChangeText={(value) => handleNewProductChange('description', value)}
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Ürün veya tedarik notu..."
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleAddProduct}>
                <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" style={{ marginRight: 7 }} />
                <Text style={styles.submitButtonText}>Ürünü Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    padding: 24,
  },
  headerRow: {
    width: '100%',
    maxWidth: 1100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  headerRowLarge: {
    maxWidth: 1100,
  },
  eyebrow: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#64748B',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  pageTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12.5,
    color: '#64748B',
  },
  saveButton: {
    minHeight: 40,
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  saveButtonText: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButton: {
    minHeight: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  secondaryButtonText: {
    fontFamily: FONT_FAMILY,
    color: '#1E3A8A',
    fontSize: 13.5,
    fontWeight: '800',
  },
  summaryGrid: {
    width: '100%',
    maxWidth: 1100,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: 210,
    ...CARD_STYLES.panel,
    padding: 14,
    marginHorizontal: 6,
    marginBottom: 10,
  },
  summaryLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '800',
  },
  summaryValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    color: '#1E3A8A',
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValueSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    color: '#1E3A8A',
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 7,
  },
  warningValue: {
    color: '#F97316',
  },
  summaryHint: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  listContent: {
    width: '100%',
    maxWidth: 1100,
    paddingBottom: 120,
  },
  productCard: {
    width: '100%',
    ...CARD_STYLES.panel,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 78,
    height: 78,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginRight: 14,
  },
  productInfo: {
    flex: 1,
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  productTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15.5,
    fontWeight: '900',
    color: '#1E293B',
    marginRight: 8,
  },
  productMeta: {
    fontFamily: FONT_FAMILY,
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 5,
    marginBottom: 12,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  warningBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#F97316',
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginHorizontal: -4,
  },
  metricBox: {
    minWidth: 110,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    marginBottom: 6,
  },
  metricLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '800',
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '900',
  },
  metricInput: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '900',
    padding: 0,
  },
  priceBox: {
    minWidth: 130,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    marginBottom: 6,
  },
  priceInput: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    color: '#1E3A8A',
    fontWeight: '900',
    padding: 0,
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    maxWidth: 520,
  },
  centerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: '#334155',
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center',
  },
  centerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  retryButtonText: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    color: '#0F172A',
    fontWeight: '900',
  },
  modalSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#475569',
    fontWeight: '800',
    marginBottom: 6,
  },
  formInput: {
    fontFamily: FONT_FAMILY,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  selectGrid: {
    marginBottom: 6,
  },
  formGroupHalf: {
    marginBottom: 14,
  },
  selectPill: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  selectPillActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EFF6FF',
  },
  selectPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  selectPillTextActive: {
    color: '#1E3A8A',
    fontWeight: '900',
  },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  formColumn: {
    flex: 1,
    minWidth: 150,
    marginHorizontal: 5,
    marginBottom: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontFamily: FONT_FAMILY,
    color: '#64748B',
    fontWeight: '800',
    fontSize: 13.5,
  },
  submitButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
});

export default StockScreen;
