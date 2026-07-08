export { API_URL, apiClient } from './apiClient';

export {
  addBrand,
  addCategory,
  addModel,
  addProduct,
  deleteProduct,
  deleteProductById,
  fetchBrandById,
  fetchBrands,
  fetchCategories,
  fetchCategoryById,
  fetchModelById,
  fetchModels,
  fetchProductById,
  fetchProducts,
  fetchUserProducts,
  updateProduct,
  updateProductInventory,
} from './api/productApi';

export {
  fetchUserById,
  loginUser,
  registerUser,
  updateUserProfile,
  updateUserSettings,
} from './api/authApi';

export {
  addFavorite,
  fetchCustomerInsights,
  fetchFavoriteProducts,
  fetchWholesalerDetails,
  removeFavorite,
} from './api/customerApi';

export {
  fetchUserCariAccounts,
  fetchUserStatement,
  fetchWholesalerAccounts,
  fetchWholesalerPayments,
  submitPaymentNotification,
  updatePaymentStatus,
} from './api/accountingApi';

export {
  fetchUserOrders,
  fetchWholesalerInsights,
  fetchWholesalerOrders,
  submitOrderRating,
  submitPurchase,
  updateOrderStatus,
} from './api/orderApi';

export {
  addEmployee,
  deleteEmployee,
  fetchEmployees,
} from './api/employeeApi';
