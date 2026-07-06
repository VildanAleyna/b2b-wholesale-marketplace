const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const loadEnvFile = () => {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        return;
    }

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return;
        }

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) {
            return;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    });
};

loadEnvFile();

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/Toptanci';
const corsOrigin = process.env.CORS_ORIGIN || '*';
const { Schema } = mongoose;

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

const sanitizeEmployee = (employee) => {
    const { password, ...safeEmployee } = employee.toObject ? employee.toObject() : employee;
    return safeEmployee;
};

const sanitizeUser = (user) => {
    if (!user) {
        return user;
    }

    const userObject = user.toObject ? user.toObject() : user;
    const { password, employee, ...safeUser } = userObject;

    if (Array.isArray(employee)) {
        safeUser.employee = employee.map(sanitizeEmployee);
    }

    return safeUser;
};

// MongoDB bağlantısı
const connectDB = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB bağlantısı başarılı.');
    } catch (err) {
        console.error('MongoDB bağlantısı başarısız:', err);
    }
};

connectDB();

// CORS Middleware
app.use(cors({ origin: corsOrigin }));

// Middleware
app.use(express.json());

// Model tanımlamaları
const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, required: true },
    modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, required: true },
    image: { type: String, required: true },
    minOrderQuantity: { type: Number, default: 1 }, // Minimum sipariş adedi (MOQ)
    wholesalers: [{
        usersID: { type: mongoose.Schema.Types.ObjectId, required: true },
        name: String,
        price: { type: Number, required: true }, 
        stockQuantity: { type: Number, required: true },
        minStockLevel: { type: Number, required: true },
        description: { type: String }
    }]
});


const Product = mongoose.model('Product', ProductSchema);


const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    companyName: { type: String, default: "" },
    authorizedPerson: { type: String, default: "" },
    taxNumber: String,
    taxOffice: { type: String, default: "" },
    wholesaler: Boolean,
    address: { type: String, default: "" }, // Sevkiyat Adresi
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
    tier: { type: String, enum: ['Gold', 'Silver', 'Bronze'], default: 'Bronze' }, // Bayi iskonto sınıfı
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
        status: { type: String, enum: ['Pending', 'Preparing', 'Shipped', 'Delivered'], default: 'Pending' }, // Sipariş lojistik durumu (Pending = Sipariş Alındı)
        trackingNumber: { type: String, default: "" }, // Kargo takip kodu
        wholesalerName: { type: String, default: "" }, // Toptancı adı
        rating: { type: Number, default: 0 }, // Değerlendirme puanı (1-5)
        review: { type: String, default: "" }, // Yorum
        date: { type: Date, default: Date.now }
    }]
});

const User = mongoose.model('User', UserSchema);

const PaymentNotificationSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    wholesalerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    receiptFile: { type: String, required: true }, // Simüle edilen dosya adı
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});
const PaymentNotification = mongoose.model('PaymentNotification', PaymentNotificationSchema);

const CategorySchema = new mongoose.Schema({
    name: String,
    image: String,
    modelIds: [mongoose.Schema.Types.ObjectId]
});
const Category = mongoose.model('Category', CategorySchema);

const ModelSchema = new mongoose.Schema({
    name: String,
    brandIds: [mongoose.Schema.Types.ObjectId],
});
const Model = mongoose.model('Model', ModelSchema);

const BrandSchema = new mongoose.Schema({
    name: { type: String, required: true },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

const Brand = mongoose.model('Brand', BrandSchema);

// Kullanıcı kayıt endpoint'i
app.post('/register', async (req, res) => {
    const { name, email, password, taxNumber, wholesaler } = req.body;

    if (!name || !email || !password || !taxNumber || wholesaler === null || wholesaler === undefined) {
        return res.status(400).json({ message: 'Ad, e-posta, şifre, vergi numarası ve kullanıcı tipi zorunludur.' });
    }

    const hashedPassword = hashPassword(password);

    const defaultEmployee = {
        name: 'admin',
        admin: true,
        password: hashPassword('admin'),
    };

    const userData = {
        name,
        email,
        password: hashedPassword,
        taxNumber,
        wholesaler,
        ...(wholesaler ? { products: [], employee: [defaultEmployee] } : { favorites: [] }),
    };

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Bu e-posta adresi zaten kayıtlı.' });
        }

        const newUser = await User.create(userData);
        res.status(201).json(sanitizeUser(newUser));
    } catch (error) {
        
        res.status(500).json({ message: 'Kullanıcı kaydedilemedi.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const identifier = (email || '').trim();

    if (!identifier || !password) {
        return res.status(400).json({ message: 'E-posta/kullanıcı adı ve şifre zorunludur.' });
    }

    try {
        const user = await User.findOne({ email: identifier });
        if (user && user.password === hashPassword(password)) {
            return res.json({
                ...sanitizeUser(user),
                accountType: user.wholesaler ? 'wholesalerAdmin' : 'customer',
            });
        }

        const wholesalers = await User.find({ wholesaler: true, 'employee.name': identifier });
        const matchedWholesaler = wholesalers.find((wholesaler) => (
            (wholesaler.employee || []).some((employee) => (
                employee.name === identifier && employee.password === hashPassword(password)
            ))
        ));

        if (!matchedWholesaler) {
            return res.status(401).json({ message: 'E-posta/kullanıcı adı veya şifre hatalı.' });
        }

        const matchedEmployee = matchedWholesaler.employee.find((employee) => (
            employee.name === identifier && employee.password === hashPassword(password)
        ));

        res.json({
            _id: matchedWholesaler._id,
            employeeId: matchedEmployee._id,
            name: matchedEmployee.name,
            email: matchedWholesaler.email,
            companyName: matchedWholesaler.companyName,
            wholesalerName: matchedWholesaler.name,
            wholesaler: true,
            employeeAccount: true,
            employeeRole: matchedEmployee.role || (matchedEmployee.admin ? 'admin' : 'Depo Görevlisi'),
            accountType: 'employee',
        });
    } catch (error) {
        res.status(500).json({ message: 'Giriş sırasında sunucu hatası oluştu.' });
    }
});

app.put('/users/:id', async (req, res) => {
    const userId = req.params.id;
    const updatedUser = req.body;

    if (updatedUser.password) {
        updatedUser.password = hashPassword(updatedUser.password);
    }

    // 'wholesaler' değişmişse uygun diziyi güncelleyin
    if (updatedUser.wholesaler !== undefined) {
        if (updatedUser.wholesaler) {
            updatedUser.employee = updatedUser.employee || []; // Boş bir employee dizisi oluştur
            updatedUser.favorites = undefined; // favorites dizisini kaldır
        } else {
            updatedUser.favorites = updatedUser.favorites || []; // Boş bir favorites dizisi oluştur
            updatedUser.employee = undefined; // employee dizisini kaldır
        }
    }

    try {
        const user = await User.findByIdAndUpdate(userId, updatedUser, { new: true });
        res.json(sanitizeUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcı güncellenemedi.', error });
    }
});

// Kullanıcıları almak için bir endpoint
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users.map(sanitizeUser));
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcılar alınamadı.' });
    }
});

app.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }
        res.json(sanitizeUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});


// Kullanıcının favori ürünlerini almak için bir endpoint
app.get('/users/:userId/favorites', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Kullanıcıyı ve favori ürünlerinin ObjectId'lerini alın
        const user = await User.findById(userId).populate('favorites');
        
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // Favori ürünleri bulun
        const favoriteProducts = await Product.find({ _id: { $in: user.favorites } });

        res.json(favoriteProducts);
    } catch (error) {
        
        res.status(500).json({ message: 'Favori ürünler alınamadı.' });
    }
});

// Kullanıcının ürünlerini almak için endpoint
app.get('/users/:userId/products', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Kullanıcıyı ve ürünlerinin ObjectId'lerini alın
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // Kullanıcının ürünleri listesi
        const userProducts = user.products;

        // Ürün ID'lerini kullanarak ürün bilgilerini alın
        const productDetails = await Product.find({ _id: { $in: userProducts.map(p => p.productID) } });

        res.json(productDetails);
    } catch (error) {
        res.status(500).json({ message: 'Ürünler alınamadı.', error });
    }
});


// Kullanıcı ürünlerini güncelleme işlevi
app.put('/users/:id/products', async (req, res) => {
    const userId = req.params.id;
    const { productId, price, stockQuantity, minStockLevel } = req.body;

    try {
        // Kullanıcıyı bulun
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // Ürünün ID'sini ObjectId olarak oluşturun
        const productObjectId = new mongoose.Types.ObjectId(productId);

        user.products.push({
            productID: productObjectId,
            price,
            stockQuantity,
            minStockLevel
        });
        

        // Kullanıcıyı güncelleyin
        const updatedUser = await user.save();
        res.json(sanitizeUser(updatedUser));
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ message: 'Kullanıcı ürünleri güncellenemedi.', error: error.message });
    }
});

// Kategorileri almak için bir endpoint
app.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Kategoriler alınamadı.' });
    }
});

// Modelleri almak için bir endpoint
app.get('/models', async (req, res) => {
    try {
        const models = await Model.find();
        res.json(models);
    } catch (error) {
        res.status(500).json({ message: 'Modeller alınamadı.' });
    }
});

app.get('/models/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const model = await Model.findById(id);
        if (!model) {
            return res.status(404).json({ message: 'Model bulunamadı' });
        }
        res.json(model);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});


// Ürünleri almak için bir endpoint
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Ürünler alınamadı.' });
    }
});

// Ürün ekleme işlevinde
app.post('/products', async (req, res) => {
    try {
        const { title, categoryId, modelId, brandId, image, wholesalers } = req.body;
        
        if (!title || !categoryId || !modelId || !brandId || !image || !wholesalers) {
            return res.status(400).json({ message: 'Eksik veri.' });
        }

        const newProduct = new Product({
            title,
            categoryId: new mongoose.Types.ObjectId(categoryId),
            modelId: new mongoose.Types.ObjectId(modelId),
            brandId: new mongoose.Types.ObjectId(brandId),
            image,
            wholesalers: wholesalers.map(wholesaler => ({
                usersID: new mongoose.Types.ObjectId(wholesaler.usersID),
                price: wholesaler.price,
                stockQuantity: wholesaler.stockQuantity,
                minStockLevel: wholesaler.minStockLevel,
                description: wholesaler.description
            }))
        });

        const result = await newProduct.save();
        const firstWholesaler = wholesalers[0];
        if (firstWholesaler?.usersID) {
            await User.findByIdAndUpdate(firstWholesaler.usersID, {
                $addToSet: {
                    products: {
                        productID: result._id,
                        price: firstWholesaler.price,
                        stockQuantity: firstWholesaler.stockQuantity,
                        minStockLevel: firstWholesaler.minStockLevel
                    }
                }
            });
        }
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Ürün eklenemedi.', error: error.message });
    }
});

app.get('/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let update = req.body;
        const wholesalerUpdates = {};
        if (req.body.price !== undefined) {
            wholesalerUpdates['wholesalers.0.price'] = Number(req.body.price);
        }
        if (req.body.stockQuantity !== undefined) {
            wholesalerUpdates['wholesalers.0.stockQuantity'] = Number(req.body.stockQuantity);
        }
        if (req.body.minStockLevel !== undefined) {
            wholesalerUpdates['wholesalers.0.minStockLevel'] = Number(req.body.minStockLevel);
        }
        if (Object.keys(wholesalerUpdates).length > 0) {
            update = { $set: wholesalerUpdates };
        }

        const product = await Product.findByIdAndUpdate(id, update, { new: true });
        if (!product) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }
        if (Object.keys(wholesalerUpdates).length > 0) {
            const wholesalerId = product.wholesalers?.[0]?.usersID;
            if (wholesalerId) {
                await User.updateOne(
                    { _id: wholesalerId, 'products.productID': product._id },
                    {
                        $set: {
                            'products.$.price': product.wholesalers[0].price,
                            'products.$.stockQuantity': product.wholesalers[0].stockQuantity,
                            'products.$.minStockLevel': product.wholesalers[0].minStockLevel
                        }
                    }
                );
            }
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }
        res.json({ message: 'Ürün silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});


// Kategori eklemek için bir endpoint
app.post('/categories', async (req, res) => {
    try {
        const { name, image, modelIds } = req.body;
        const newCategory = new Category({ name, modelIds, image });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        
        res.status(500).json({ message: 'Kategori eklenemedi.' });
    }
});

app.get('/categories/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Kategori bulunamadı' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});


// Model eklemek için bir endpoint
app.post('/models', async (req, res) => {
    try {
        const { name, brandIds } = req.body;
        const newModel = new Model({ name, brandIds });
        await newModel.save();
        res.status(201).json(newModel);
    } catch (error) {
        
        res.status(500).json({ message: 'Model eklenemedi.' });
    }
});
// Markaları almak için bir endpoint
app.get('/brands', async (req, res) => {
    try {
        const brands = await Brand.find();
        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: 'Markalar alınamadı.' });
    }
});

// Marka eklemek için bir endpoint
app.post('/brands', async (req, res) => {
    try {
        const { name, productIds } = req.body;
        const newBrand = new Brand({ name, productIds });
        await newBrand.save();
        res.status(201).json(newBrand);
    } catch (error) {
        
        res.status(500).json({ message: 'Marka eklenemedi.' });
    }
});


app.get('/brands/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const brand = await Brand.findById(id);
        if (!brand) {
            return res.status(404).json({ message: 'Marka bulunamadı' });
        }
        res.json(brand);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});


// Marka güncelleme işlevi
app.put('/brands/:id', async (req, res) => {
    const brandId = req.params.id;
    const { productId } = req.body;

    try {
        // Marka bilgilerini güncelle
        const updatedBrand = await Brand.findByIdAndUpdate(
            brandId,
            { $addToSet: { productIds: productId } }, // productId'yi diziye ekle
            { new: true }
        );
        if (!updatedBrand) {
            return res.status(404).json({ message: 'Marka bulunamadı.' });
        }
        res.json(updatedBrand);
    } catch (error) {
        
        res.status(500).json({ message: 'Marka güncellenemedi.', error: error.message });
    }
});

// Kullanıcının favorilerine ürün eklemek için bir endpoint
app.put('/users/:id/favorites/add', async (req, res) => {
    const userId = req.params.id;
    const { productId } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { favorites: new mongoose.Types.ObjectId(productId) } }, // productId'yi favorites dizisine ekle
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        res.json(sanitizeUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Favorilere ürün eklenemedi.', error: error.message });
    }
});

// Kullanıcının favorilerinden ürün çıkarmak için bir endpoint
app.put('/users/:id/favorites/remove', async (req, res) => {
    const userId = req.params.id;
    const { productId } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { favorites: new mongoose.Types.ObjectId(productId) } }, // productId'yi favorites dizisinden çıkar
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        res.json(sanitizeUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Favorilerden ürün çıkarılamadı.', error: error.message });
    }
});

// Belirli bir toptancının detaylarını almak için endpoint
app.get('/wholesalers/:id', async (req, res) => {
    try {
        const wholesaler = await User.findOne({ _id: req.params.id, wholesaler: true });
        if (!wholesaler) {
            return res.status(404).json({ message: 'Toptancı bulunamadı.' });
        }
        res.json({
            _id: wholesaler._id,
            name: wholesaler.name,
            email: wholesaler.email,
            taxNumber: wholesaler.taxNumber,
            address: wholesaler.address || 'Adres bilgisi girilmemiş',
            phone: wholesaler.phone || 'Telefon bilgisi girilmemiş'
        });
    } catch (error) {
        res.status(500).json({ message: 'Toptancı bilgileri alınamadı.', error: error.message });
    }
});

// Kullanıcının cari hesaplarını almak için endpoint
app.get('/users/:userId/accounts', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('wholesalerAccounts.wholesalerId', 'name email address phone taxNumber');
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
        res.json(user.wholesalerAccounts || []);
    } catch (error) {
        res.status(500).json({ message: 'Cari hesaplar alınamadı.', error: error.message });
    }
});

// Toptancının bayi cari hesaplarını almak için endpoint
app.get('/wholesalers/:id/accounts', async (req, res) => {
    try {
        const wholesalerId = new mongoose.Types.ObjectId(req.params.id);
        const customers = await User.find({
            wholesaler: false,
            $or: [
                { 'wholesalerAccounts.wholesalerId': wholesalerId },
                { 'orders.wholesalerId': wholesalerId }
            ]
        }).select('name email phone taxNumber tier wholesalerAccounts orders');

        const payments = await PaymentNotification.find({ wholesalerId });

        const accounts = customers.map((customer) => {
            const account = customer.wholesalerAccounts.find(
                acc => acc.wholesalerId.toString() === wholesalerId.toString()
            );
            const customerPayments = payments.filter(
                payment => payment.customerId.toString() === customer._id.toString()
            );
            const approvedPayments = customerPayments.filter(payment => payment.status === 'Approved');
            const pendingPayments = customerPayments.filter(payment => payment.status === 'Pending');
            const orders = (customer.orders || []).filter(
                order => order.wholesalerId?.toString() === wholesalerId.toString()
            );

            return {
                customer: sanitizeUser(customer),
                creditLimit: account?.creditLimit || 0,
                currentDebt: account?.currentDebt || orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
                remainingLimit: (account?.creditLimit || 0) - (account?.currentDebt || orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)),
                orderCount: orders.length,
                totalOrderAmount: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
                approvedPaymentTotal: approvedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
                pendingPaymentTotal: pendingPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
                lastOrderDate: orders.length ? orders.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null,
            };
        });

        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: 'Bayi cari hesapları alınamadı.', error: error.message });
    }
});

// Ödeme bildirimini kaydetme endpoint'i (Bayi gönderir)
app.post('/payments/notify', async (req, res) => {
    const { customerId, wholesalerId, amount, receiptFile } = req.body;
    try {
        const newNotification = await PaymentNotification.create({
            customerId,
            wholesalerId,
            amount,
            receiptFile,
            status: 'Pending'
        });
        res.status(201).json(newNotification);
    } catch (error) {
        res.status(500).json({ message: 'Ödeme bildirimi kaydedilemedi.', error: error.message });
    }
});

// Toptancıya gelen ödeme bildirimlerini listeleme
app.get('/wholesalers/:id/payments', async (req, res) => {
    try {
        const payments = await PaymentNotification.find({ wholesalerId: req.params.id })
            .populate('customerId', 'name email taxNumber')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Ödeme bildirimleri alınamadı.', error: error.message });
    }
});

// Toptancının ödemeyi onaylaması veya reddetmesi
app.put('/payments/:id/status', async (req, res) => {
    const { status } = req.body; // 'Approved' veya 'Rejected'
    try {
        const payment = await PaymentNotification.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Ödeme bildirimi bulunamadı.' });
        }

        if (payment.status !== 'Pending') {
            return res.status(400).json({ message: 'Bu bildirim zaten sonuçlandırılmış.' });
        }

        payment.status = status;
        await payment.save();

        // Eğer onaylandıysa, bayinin ilgili cari hesabındaki borcundan düşelim
        if (status === 'Approved') {
            const customer = await User.findById(payment.customerId);
            if (customer) {
                const account = customer.wholesalerAccounts.find(
                    acc => acc.wholesalerId.toString() === payment.wholesalerId.toString()
                );
                if (account) {
                    account.currentDebt = Math.max(0, account.currentDebt - payment.amount);
                    customer.markModified('wholesalerAccounts'); // Alt döküman değişikliğini bildir
                    await customer.save();
                }
            }
        }

        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Ödeme durumu güncellenemedi.', error: error.message });
    }
});

// Sipariş Oluşturma / Ödeme Altyapısı (Bayi Satın Alması)
app.post('/users/:userId/purchase', async (req, res) => {
    const { userId } = req.params;
    const { wholesalerId, totalAmount, paymentMethod, products } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // Eğer ödeme yöntemi Cari ise limit kontrolü ve borçlandırma yapalım
        if (paymentMethod === 'Cari') {
            if (!wholesalerId) {
                return res.status(400).json({ message: 'Cari ödemesi için toptancı ID gereklidir.' });
            }

            const account = user.wholesalerAccounts.find(
                acc => acc.wholesalerId.toString() === wholesalerId.toString()
            );

            if (!account) {
                return res.status(400).json({ message: 'Bu toptancı ile aktif bir cari hesabınız bulunmuyor.' });
            }

            const remainingLimit = account.creditLimit - account.currentDebt;
            if (totalAmount > remainingLimit) {
                return res.status(400).json({ message: `Yetersiz Cari Limit! Sipariş tutarı: ${totalAmount} ₺, Kalan limitiniz: ${remainingLimit} ₺` });
            }

            // Borcu artıralım
            account.currentDebt += totalAmount;
            user.markModified('wholesalerAccounts');
        }

        // Toptancı adını veritabanından çekelim
        let wholesalerName = 'Toptancı Mağazası';
        if (wholesalerId) {
            const wholesalerObj = await User.findById(wholesalerId);
            if (wholesalerObj) {
                wholesalerName = wholesalerObj.name;
            }
        }

        // Siparişi kullanıcının geçmişine ekleyelim
        const newOrder = {
            products: products.map(p => ({
                productId: new mongoose.Types.ObjectId(p._id || p.productId),
                title: p.title,
                image: p.image,
                price: p.price,
                count: p.count
            })),
            totalAmount,
            paymentMethod,
            wholesalerId: wholesalerId ? new mongoose.Types.ObjectId(wholesalerId) : undefined,
            wholesalerName,
            status: 'Pending', // Sipariş ilk alındığında durum 'Sipariş Alındı' olarak başlar
            date: new Date()
        };

        user.orders.push(newOrder);

        // Otomatik sadakat derecesi (tier) atama sistemi
        const totalSpent = user.orders.reduce((sum, o) => sum + o.totalAmount, 0);
        let newTier = 'Bronze';
        if (totalSpent >= 100000) {
            newTier = 'Gold';
        } else if (totalSpent >= 20000) {
            newTier = 'Silver';
        }
        user.tier = newTier;

        await user.save();

        res.status(201).json({ message: 'Sipariş başarıyla oluşturuldu.', user: sanitizeUser(user) });
    } catch (error) {
        res.status(500).json({ message: 'Sipariş işlenirken hata oluştu.', error: error.message });
    }
});

// Kullanıcının sipariş geçmişini alma
app.get('/users/:userId/orders', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
        res.json(user.orders || []);
    } catch (error) {
        res.status(500).json({ message: 'Sipariş geçmişi alınamadı.', error: error.message });
    }
});

// Bayi Cari Hesap Ekstre Dökümü (Siparişler - Borç & Havaleler - Alacak)
app.get('/users/:userId/statement', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // 1. Siparişleri (borç yazılan kalemleri) alalım
        const orderRows = (user.orders || []).map(order => ({
            _id: order._id,
            date: order.date,
            type: 'Sipariş',
            description: order.paymentMethod === 'Cari' ? 'Cari Sipariş Alımı' : 'Kredi Kartı ile Sipariş',
            amount: order.totalAmount,
            effect: 'debit', // Borç (hesaptan çıkan)
            reference: order._id
        }));

        // 2. Onaylanmış havaleleri (alacak/ödeme kalemlerini) alalım
        const approvedPayments = await PaymentNotification.find({
            customerId: userId,
            status: 'Approved'
        });

        const paymentRows = approvedPayments.map(pay => ({
            _id: pay._id,
            date: pay.createdAt || pay.date,
            type: 'Ödeme',
            description: `EFT/Havale Bildirimi (${pay.receiptFile || 'Dekont'})`,
            amount: pay.amount,
            effect: 'credit', // Alacak (ödeme yapılan)
            reference: pay._id
        }));

        // 3. İki diziyi birleştir ve tarihe göre yeniden eskiye sırala
        const statement = [...orderRows, ...paymentRows];
        statement.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(statement);
    } catch (error) {
        res.status(500).json({ message: 'Cari ekstre dökümü oluşturulamadı.', error: error.message });
    }
});

// Toptancıya verilmiş olan tüm siparişleri listeleme (Lojistik Takip)
app.get('/wholesalers/:wholesalerId/orders', async (req, res) => {
    const { wholesalerId } = req.params;
    try {
        // Toptancı siparişine sahip olan tüm bayileri (müşterileri) bulalım
        const customers = await User.find({ 'orders.wholesalerId': wholesalerId });
        
        let wholesalerOrders = [];
        customers.forEach(customer => {
            customer.orders.forEach(order => {
                if (order.wholesalerId && order.wholesalerId.toString() === wholesalerId) {
                    wholesalerOrders.push({
                        orderId: order._id,
                        customerId: customer._id,
                        customerName: customer.name,
                        customerEmail: customer.email,
                        products: order.products,
                        totalAmount: order.totalAmount,
                        paymentMethod: order.paymentMethod,
                        status: order.status || 'Preparing',
                        trackingNumber: order.trackingNumber || '',
                        date: order.date
                    });
                }
            });
        });

        // Tarihe göre yeniden eskiye sıralayalım
        wholesalerOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(wholesalerOrders);
    } catch (error) {
        res.status(500).json({ message: 'Gelen siparişler alınamadı.', error: error.message });
    }
});

// Toptancının sipariş kargo durumunu ve takip kodunu güncellemesi
app.put('/customers/:customerId/orders/:orderId/status', async (req, res) => {
    const { customerId, orderId } = req.params;
    const { status, trackingNumber } = req.body; // status: 'Preparing', 'Shipped', 'Delivered'

    try {
        const customer = await User.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Müşteri bulunamadı.' });
        }

        // İlgili siparişi bulup güncelleyelim
        const order = customer.orders.find(o => o._id.toString() === orderId);
        if (!order) {
            return res.status(404).json({ message: 'Sipariş bulunamadı.' });
        }

        order.status = status;
        if (trackingNumber !== undefined) {
            order.trackingNumber = trackingNumber;
        }

        customer.markModified('orders');
        await customer.save();

        res.json({ message: 'Sipariş durumu başarıyla güncellendi.', order });
    } catch (error) {
        res.status(500).json({ message: 'Sipariş durumu güncellenemedi.', error: error.message });
    }
});

// Bayinin siparişe istinaden toptancıyı puanlaması
app.put('/customers/:customerId/orders/:orderId/rate', async (req, res) => {
    const { customerId, orderId } = req.params;
    const { rating, review } = req.body; // rating: 1-5, review: string

    try {
        const customer = await User.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Müşteri bulunamadı.' });
        }

        const order = customer.orders.find(o => o._id.toString() === orderId);
        if (!order) {
            return res.status(404).json({ message: 'Sipariş bulunamadı.' });
        }

        order.rating = rating;
        if (review !== undefined) {
            order.review = review;
        }

        // Toptancının genel ortalama puanını güncelleyelim
        if (order.wholesalerId) {
            const wholesaler = await User.findById(order.wholesalerId);
            if (wholesaler) {
                // Toptancıya verilmiş tüm siparişlerdeki puanları tarayalım
                const allCustomers = await User.find({ 'orders.wholesalerId': order.wholesalerId });
                let sum = 0;
                let count = 0;

                allCustomers.forEach(cust => {
                    cust.orders.forEach(ord => {
                        if (ord.wholesalerId && ord.wholesalerId.toString() === order.wholesalerId.toString()) {
                            const itemRating = ord._id.toString() === orderId ? rating : (ord.rating || 0);
                            if (itemRating > 0) {
                                sum += itemRating;
                                count++;
                            }
                        }
                    });
                });

                if (count > 0) {
                    wholesaler.rating = parseFloat((sum / count).toFixed(1));
                    wholesaler.ratingCount = count;
                    await wholesaler.save();
                }
            }
        }

        customer.markModified('orders');
        await customer.save();

        res.json({ message: 'Değerlendirme başarıyla kaydedildi.', order });
    } catch (error) {
        res.status(500).json({ message: 'Değerlendirme kaydedilemedi.', error: error.message });
    }
});

// Bayinin profil bilgilerini güncellemesi (B2B Kayıt Detayları)
app.put('/users/:userId/profile', async (req, res) => {
    const { userId } = req.params;
    const { companyName, authorizedPerson, taxNumber, taxOffice, phone, address } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (companyName !== undefined) user.companyName = companyName;
        if (authorizedPerson !== undefined) user.authorizedPerson = authorizedPerson;
        if (taxNumber !== undefined) user.taxNumber = taxNumber;
        if (taxOffice !== undefined) user.taxOffice = taxOffice;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;

        // B2B sistemde kullanıcı adı firma adıdır
        if (companyName) {
            user.name = companyName;
        }

        await user.save();
        res.json({ message: 'Profil başarıyla güncellendi.', user: sanitizeUser(user) });
    } catch (error) {
        res.status(500).json({ message: 'Profil güncellenirken hata oluştu.', error: error.message });
    }
});

// Bayinin ayarlarını ve bildirim tercihlerini güncellemesi
app.put('/users/:userId/settings', async (req, res) => {
    const { userId } = req.params;
    const { notificationEmail, notificationLimitWarning, newPassword } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (notificationEmail !== undefined) user.notificationEmail = notificationEmail;
        if (notificationLimitWarning !== undefined) user.notificationLimitWarning = notificationLimitWarning;

        if (newPassword) {
            // Şifreyi SHA-256 ile backend tarafında hashliyoruz
            user.password = hashPassword(newPassword);
        }

        await user.save();
        res.json({ message: 'Ayarlar başarıyla güncellendi.', user: sanitizeUser(user) });
    } catch (error) {
        res.status(500).json({ message: 'Ayarlar güncellenirken hata oluştu.', error: error.message });
    }
});

// Toptancı Personel Yönetimi (Çalışanlar) APIs
// 1. Personel Listesini Getir
app.get('/wholesalers/:wholesalerId/employees', async (req, res) => {
    const { wholesalerId } = req.params;
    try {
        const user = await User.findById(wholesalerId);
        if (!user) {
            return res.status(404).json({ message: 'Toptancı bulunamadı.' });
        }
        res.json({ employees: (user.employee || []).map(sanitizeEmployee) });
    } catch (error) {
        res.status(500).json({ message: 'Personel listesi getirilirken hata oluştu.', error: error.message });
    }
});

// 2. Yeni Personel Ekle
app.post('/wholesalers/:wholesalerId/employees', async (req, res) => {
    const { wholesalerId } = req.params;
    const { name, role, password } = req.body;

    if (!name || !role || !password) {
        return res.status(400).json({ message: 'İsim, rol ve şifre zorunludur.' });
    }

    try {
        const user = await User.findById(wholesalerId);
        if (!user) {
            return res.status(404).json({ message: 'Toptancı bulunamadı.' });
        }

        user.employee = user.employee || [];

        // Aynı isimde personel var mı kontrol et
        const exists = user.employee.some(emp => emp.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            return res.status(400).json({ message: 'Bu isimde bir personel zaten mevcut.' });
        }

        const hashedPassword = hashPassword(password);

        const newEmp = {
            name,
            role,
            password: hashedPassword,
            createdAt: new Date()
        };

        user.employee.push(newEmp);
        await user.save();

        res.status(201).json({ message: 'Personel başarıyla eklendi.', employees: user.employee.map(sanitizeEmployee) });
    } catch (error) {
        res.status(500).json({ message: 'Personel eklenirken hata oluştu.', error: error.message });
    }
});

// 3. Personel Sil
app.delete('/wholesalers/:wholesalerId/employees/:employeeName', async (req, res) => {
    const { wholesalerId, employeeName } = req.params;

    try {
        const user = await User.findById(wholesalerId);
        if (!user) {
            return res.status(404).json({ message: 'Toptancı bulunamadı.' });
        }

        user.employee = user.employee || [];
        const originalLength = user.employee.length;

        // Admin silinemez koruması
        if (employeeName === 'admin') {
            return res.status(400).json({ message: 'Ana yönetici (admin) hesabı silinemez.' });
        }

        user.employee = user.employee.filter(emp => emp.name !== employeeName);

        if (user.employee.length === originalLength) {
            return res.status(404).json({ message: 'Personel bulunamadı.' });
        }

        await user.save();
        res.json({ message: 'Personel başarıyla silindi.', employees: user.employee.map(sanitizeEmployee) });
    } catch (error) {
        res.status(500).json({ message: 'Personel silinirken hata oluştu.', error: error.message });
    }
});

// Server'ı başlat
app.listen(port, () => {
    console.log(`Server ${port} numaralı portta çalışıyor.`);
});
