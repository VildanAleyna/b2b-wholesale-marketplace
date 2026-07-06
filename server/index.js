const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const app = express();
const port = 3000;
const { Schema } = mongoose;

// MongoDB bağlantısı
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/Toptanci');
        console.log('MongoDB bağlantısı başarılı.');
    } catch (err) {
        console.error('MongoDB bağlantısı başarısız:', err);
    }
};

connectDB();

// CORS Middleware
app.use(cors());

// Middleware
app.use(express.json());

// Model tanımlamaları
const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, required: true },
    modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, required: true },
    image: { type: String, required: true },
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
    taxNumber: String,
    wholesaler: Boolean,
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
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
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    const defaultEmployee = {
        name: 'admin',
        admin: true,
        password: crypto.createHash('sha256').update('admin').digest('hex'),
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
        const newUser = await User.create(userData);
        res.status(201).json(newUser);
    } catch (error) {
        
        res.status(500).json({ message: 'Kullanıcı kaydedilemedi.' });
    }
});

app.put('/users/:id', async (req, res) => {
    const userId = req.params.id;
    const updatedUser = req.body;

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
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcı güncellenemedi.', error });
    }
});

// Kullanıcıları almak için bir endpoint
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
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
        res.json(user);
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
        res.json(updatedUser);
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
        const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
        if (!product) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
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

        res.json(user);
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

        res.json(user);
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


// Server'ı başlat
app.listen(port, () => {
    console.log(`Server ${port} numaralı portta çalışıyor.`);
});
