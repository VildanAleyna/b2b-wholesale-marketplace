const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, required: true },
    modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, required: true },
    image: { type: String, required: true },
    minOrderQuantity: { type: Number, default: 1 },
    wholesalers: [{
        usersID: { type: mongoose.Schema.Types.ObjectId, required: true },
        name: String,
        price: { type: Number, required: true },
        stockQuantity: { type: Number, required: true },
        minStockLevel: { type: Number, required: true },
        description: { type: String }
    }]
});

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    companyName: { type: String, default: "" },
    authorizedPerson: { type: String, default: "" },
    taxNumber: String,
    taxOffice: { type: String, default: "" },
    wholesaler: Boolean,
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    notificationEmail: { type: Boolean, default: true },
    notificationLimitWarning: { type: Boolean, default: true },
    wholesalerAccounts: {
        type: [{
            wholesalerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            creditLimit: { type: Number, default: 100000 },
            currentDebt: { type: Number, default: 0 }
        }],
        default: function() {
            return this.wholesaler === false ? [] : undefined;
        }
    },
    employee: {
        type: [Object],
        default: function() {
            return this.wholesaler ? [] : undefined;
        }
    },
    favorites: {
        type: [mongoose.Schema.Types.ObjectId],
        default: function() {
            return this.wholesaler === false ? [] : undefined;
        }
    },
    products: {
        type: [Object],
        default: function() {
            return this.wholesaler ? [] : undefined;
        }
    },
    tier: { type: String, enum: ['Gold', 'Silver', 'Bronze'], default: 'Bronze' },
    orders: [{
        products: [{
            productId: mongoose.Schema.Types.ObjectId,
            title: String,
            image: String,
            price: Number,
            count: Number
        }],
        totalAmount: { type: Number, required: true },
        paymentMethod: { type: String, enum: ['Cari', 'CreditCard'], required: true },
        wholesalerId: mongoose.Schema.Types.ObjectId,
        status: { type: String, enum: ['Pending', 'Preparing', 'Shipped', 'Delivered'], default: 'Pending' },
        trackingNumber: { type: String, default: "" },
        wholesalerName: { type: String, default: "" },
        rating: { type: Number, default: 0 },
        review: { type: String, default: "" },
        date: { type: Date, default: Date.now }
    }]
});

const PaymentNotificationSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    wholesalerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    receiptFile: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const CategorySchema = new mongoose.Schema({
    name: String,
    image: String,
    modelIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Model' }]
});

const ModelSchema = new mongoose.Schema({
    name: String,
    brandIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }]
});

const BrandSchema = new mongoose.Schema({
    name: String,
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const PaymentNotification = mongoose.models.PaymentNotification || mongoose.model('PaymentNotification', PaymentNotificationSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Model = mongoose.models.Model || mongoose.model('Model', ModelSchema);
const Brand = mongoose.models.Brand || mongoose.model('Brand', BrandSchema);

module.exports = {
    Product,
    User,
    PaymentNotification,
    Category,
    Model,
    Brand
};
