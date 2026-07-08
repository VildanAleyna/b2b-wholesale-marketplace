const mongoose = require('mongoose');
const { loadEnvFile } = require('./config/env');
const { hashPassword } = require('./utils/security');
const { Product, User, PaymentNotification, Category, Model, Brand } = require('./models');
const { buildSeedProducts } = require('./data/seedProductCatalog');

loadEnvFile();

// MongoDB Bağlantısı
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Toptanci';
const CUSTOMER_COUNT = 15;
const PRODUCT_TARGET_COUNT = 60;
const ORDER_COUNT = 200;
const ORDER_HISTORY_DAYS = 60;
const PAYMENT_NOTIFICATION_COUNT = 30;

const pick = (items, index) => items[index % items.length];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const seedDatabase = async () => {
    try {
        console.log('MongoDB\'ye bağlanılıyor...');
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB bağlantısı başarılı.');

        // Koleksiyonları temizle
        await mongoose.connection.db.dropDatabase();
        console.log('Eski veritabanı temizlendi.');

        // 1. Örnek Toptancı ve Müşteri Kullanıcıları Oluştur
        const wholesalerId = new mongoose.Types.ObjectId();
        const customerId = new mongoose.Types.ObjectId();

        const defaultEmployee = {
            name: 'admin',
            admin: true,
            password: hashPassword('admin'),
        };

        await User.create([
            {
                _id: wholesalerId,
                name: 'Vildan Toptan Ticaret',
                email: 'vildan@toptan.com',
                password: hashPassword('1234'),
                taxNumber: '1234567890',
                wholesaler: true,
                address: 'İstoç Toptancılar Çarşısı, 24. Ada No: 45, Bağcılar, İstanbul',
                phone: '0212 555 4545',
                employee: [defaultEmployee],
                products: []
            },
            {
                _id: customerId,
                name: 'Ahmet Bayi Market',
                email: 'ahmet@bayi.com',
                password: hashPassword('1234'),
                wholesaler: false,
                favorites: [],
                tier: 'Bronze', // Ahmet Bayi starts as a Bronze dealer (0% discount)
                companyName: 'Ahmet Bayi Market',
                authorizedPerson: 'Ahmet Yılmaz',
                taxNumber: '1234567890',
                taxOffice: 'İkitelli Vergi Dairesi',
                address: 'İstoç Ticaret Merkezi 24. Ada No: 12, Bağcılar / İstanbul',
                phone: '+90 555 123 45 67',
                notificationEmail: true,
                notificationLimitWarning: true,
                wholesalerAccounts: [
                    {
                        wholesalerId: wholesalerId,
                        creditLimit: 150000,
                        currentDebt: 45000
                    }
                ],
                orders: []
            }
        ]);
        console.log('Kullanıcılar oluşturuldu.');

        // 2. Markaları Oluştur
        const extraCustomerNames = [
            'Marmara Perakende',
            'Ege Market Grubu',
            'Akdeniz Ev Gerecleri',
            'Karadeniz Teknoloji',
            'Anadolu Gross',
            'Yildiz Bayi',
            'Kuzey Ticaret',
            'Delta Magazacilik',
            'Bereket Market',
            'Kale Elektronik',
            'Sahil Zucaciye',
            'Merkez Tedarik',
            'Nehir AVM',
            'Poyraz Market'
        ];

        const extraCustomers = extraCustomerNames.slice(0, Math.max(0, CUSTOMER_COUNT - 1)).map((name, index) => {
            const customerNo = index + 2;
            const creditLimit = pick([90000, 120000, 150000, 180000, 220000], index);

            return {
                name,
                email: `bayi${customerNo}@demo.com`,
                password: hashPassword('1234'),
                wholesaler: false,
                favorites: [],
                tier: pick(['Bronze', 'Silver', 'Gold'], index),
                companyName: name,
                authorizedPerson: pick(['Mehmet Kaya', 'Ayse Demir', 'Burak Celik', 'Elif Aydin', 'Can Yilmaz'], index),
                taxNumber: `12345678${String(customerNo).padStart(2, '0')}`,
                taxOffice: pick(['Ikitelli Vergi Dairesi', 'Kadikoy Vergi Dairesi', 'Bornova Vergi Dairesi'], index),
                address: `${name} Depo Adresi No: ${customerNo}, Istanbul`,
                phone: `+90 555 200 ${String(customerNo).padStart(2, '0')} ${String(10 + customerNo).padStart(2, '0')}`,
                notificationEmail: true,
                notificationLimitWarning: true,
                wholesalerAccounts: [{
                    wholesalerId,
                    creditLimit,
                    currentDebt: 0
                }],
                orders: []
            };
        });

        if (extraCustomers.length) {
            await User.insertMany(extraCustomers);
            console.log(`${extraCustomers.length} ek bayi olusturuldu.`);
        }

        const brandStanley = await Brand.create({ name: 'Stanley', productIds: [] });
        const brandDyson = await Brand.create({ name: 'Dyson', productIds: [] });
        const brandXiaomi = await Brand.create({ name: 'Xiaomi', productIds: [] });
        const brandKaraca = await Brand.create({ name: 'Karaca', productIds: [] });
        const brandApple = await Brand.create({ name: 'Apple', productIds: [] });
        const brandSamsung = await Brand.create({ name: 'Samsung', productIds: [] });
        const brandJbl = await Brand.create({ name: 'JBL', productIds: [] });
        const brandPhilips = await Brand.create({ name: 'Philips', productIds: [] });
        console.log('Markalar oluşturuldu.');

        // 3. Modelleri Oluştur (Marka ID'leri ile ilişkilendir)
        const modelTermos = await Model.create({ name: 'Vakumlu Termos', brandIds: [brandStanley._id] });
        const modelSupurge = await Model.create({ name: 'Kablosuz Süpürge', brandIds: [brandDyson._id] });
        const modelTelefon = await Model.create({ name: 'Akıllı Telefon', brandIds: [brandXiaomi._id, brandApple._id, brandSamsung._id] });
        const modelKahveci = await Model.create({ name: 'Kahve Makinesi', brandIds: [brandKaraca._id] });
        const modelAirwrap = await Model.create({ name: 'Saç Şekillendirici', brandIds: [brandDyson._id] });
        const modelRobot = await Model.create({ name: 'Robot Süpürge', brandIds: [brandXiaomi._id] });
        const modelTost = await Model.create({ name: 'Tost Makinesi', brandIds: [brandKaraca._id] });
        const modelPowerbank = await Model.create({ name: 'Powerbank', brandIds: [brandXiaomi._id] });
        const modelTeapot = await Model.create({ name: 'Çaydanlık', brandIds: [brandKaraca._id] });
        const modelAirfryer = await Model.create({ name: 'Airfryer', brandIds: [brandPhilips._id] });
        const modelBlender = await Model.create({ name: 'Blender', brandIds: [brandPhilips._id] });
        const modelTablet = await Model.create({ name: 'Tablet', brandIds: [brandApple._id] });
        const modelAirPods = await Model.create({ name: 'Kablosuz Kulaklık', brandIds: [brandApple._id, brandXiaomi._id, brandJbl._id] });
        const modelTV = await Model.create({ name: 'Televizyon', brandIds: [brandSamsung._id] });
        const modelSpeaker = await Model.create({ name: 'Bluetooth Hoparlör', brandIds: [brandJbl._id] });
        const modelToothbrush = await Model.create({ name: 'Şarjlı Diş Fırçası', brandIds: [brandPhilips._id] });
        const modelIron = await Model.create({ name: 'Buharlı Ütü', brandIds: [brandPhilips._id] });
        console.log('Modeller oluşturuldu.');

        // 4. Kategorileri Oluştur (4 Adet Kategori)
        const catMutfak = await Category.create({
            name: 'Mutfak Gereçleri',
            image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600',
            modelIds: [modelTermos._id, modelKahveci._id, modelTost._id, modelTeapot._id, modelAirfryer._id, modelBlender._id]
        });
        const catElektronik = await Category.create({
            name: 'Ev Elektroniği',
            image: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?q=80&w=600',
            modelIds: [modelSupurge._id, modelTelefon._id, modelRobot._id, modelPowerbank._id, modelTablet._id, modelTV._id, modelIron._id]
        });
        const catBakim = await Category.create({
            name: 'Kişisel Bakım',
            image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600',
            modelIds: [modelAirwrap._id, modelToothbrush._id]
        });
        const catSes = await Category.create({
            name: 'Ses Sistemleri',
            image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=600',
            modelIds: [modelAirPods._id, modelSpeaker._id]
        });
        console.log('Kategoriler oluşturuldu.');

        // 5. Ürünleri oluştur
        const catTelefonTablet = await Category.create({
            name: 'Telefon ve Tablet',
            image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600',
            modelIds: [modelTelefon._id, modelTablet._id, modelPowerbank._id]
        });
        const catTemizlik = await Category.create({
            name: 'Temizlik Cihazlari',
            image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=600',
            modelIds: [modelSupurge._id, modelRobot._id, modelIron._id]
        });
        const catKucukEv = await Category.create({
            name: 'Kucuk Ev Aletleri',
            image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600',
            modelIds: [modelKahveci._id, modelAirfryer._id, modelBlender._id, modelTost._id]
        });
        const catAksesuar = await Category.create({
            name: 'Aksesuar ve Tasinabilir Urunler',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600',
            modelIds: [modelPowerbank._id, modelAirPods._id, modelSpeaker._id, modelTermos._id]
        });

        const productsData = buildSeedProducts({
            catMutfak,
            catElektronik,
            catBakim,
            catSes,
            catTelefonTablet,
            catTemizlik,
            catKucukEv,
            catAksesuar,
            modelTermos,
            modelSupurge,
            modelTelefon,
            modelKahveci,
            modelAirwrap,
            modelRobot,
            modelTost,
            modelPowerbank,
            modelTeapot,
            modelAirfryer,
            modelBlender,
            modelTablet,
            modelAirPods,
            modelTV,
            modelSpeaker,
            modelToothbrush,
            modelIron,
            brandStanley,
            brandDyson,
            brandXiaomi,
            brandKaraca,
            brandApple,
            brandSamsung,
            brandJbl,
            brandPhilips
        });

        const savedProducts = [];
        for (const prodData of productsData) {
            const product = new Product({
                title: prodData.title,
                categoryId: prodData.categoryId,
                modelId: prodData.modelId,
                brandId: prodData.brandId,
                image: prodData.image,
                minOrderQuantity: prodData.moq || 1,
                wholesalers: [{
                    usersID: wholesalerId,
                    name: 'Vildan Toptan Ticaret',
                    price: prodData.price,
                    stockQuantity: prodData.stock,
                    minStockLevel: Math.ceil(prodData.stock * 0.1),
                    description: prodData.desc
                }]
            });
            const savedProduct = await product.save();
            savedProducts.push(savedProduct);
        }
        if (savedProducts.length !== PRODUCT_TARGET_COUNT) {
            console.warn(`Uyarı: ${PRODUCT_TARGET_COUNT} ürün hedeflendi, ${savedProducts.length} ürün oluşturuldu.`);
        }
        console.log(`${savedProducts.length} ürün başarıyla oluşturuldu.`);

        // 6. Ürünleri Markalarla ve Toptancıyla Geriye Dönük İlişkilendir
        for (const savedProd of savedProducts) {
            await Brand.findByIdAndUpdate(savedProd.brandId, { $push: { productIds: savedProd._id } });
        }

        // Toptancı envanterini (User.products) güncelle
        const userProducts = savedProducts.map(prod => ({
            productID: prod._id,
            price: prod.wholesalers[0].price,
            stockQuantity: prod.wholesalers[0].stockQuantity,
            minStockLevel: prod.wholesalers[0].minStockLevel
        }));

        await User.findByIdAndUpdate(wholesalerId, {
            $set: { products: userProducts }
        });

        console.log('Marka ve kullanıcı ilişkileri güncellendi.');
        const customers = await User.find({ wholesaler: false });
        const orderStatuses = ['Pending', 'Preparing', 'Shipped', 'Delivered'];
        const debtByCustomerId = new Map(customers.map(customer => [customer._id.toString(), 0]));
        const salesByProductId = new Map(savedProducts.map(product => [product._id.toString(), 0]));

        for (let index = 0; index < ORDER_COUNT; index += 1) {
            const customer = pick(customers, index);
            const productCount = randInt(1, 3);
            const orderProducts = [];
            const usedProductIds = new Set();

            while (orderProducts.length < productCount) {
                const product = pick(savedProducts, randInt(0, savedProducts.length - 1) + index);
                const productId = product._id.toString();

                if (usedProductIds.has(productId)) {
                    continue;
                }

                usedProductIds.add(productId);
                const count = randInt(product.minOrderQuantity || 1, (product.minOrderQuantity || 1) + 4);
                const price = product.wholesalers[0].price;

                orderProducts.push({
                    productId: product._id,
                    title: product.title,
                    image: product.image,
                    price,
                    count
                });

                salesByProductId.set(productId, (salesByProductId.get(productId) || 0) + count);
            }

            const totalAmount = orderProducts.reduce((sum, item) => sum + item.price * item.count, 0);
            const daysBack = randInt(0, ORDER_HISTORY_DAYS - 1);
            const status = daysBack > 21
                ? 'Delivered'
                : daysBack > 10
                    ? 'Shipped'
                    : pick(orderStatuses, index);
            const paymentMethod = index % 4 === 0 ? 'CreditCard' : 'Cari';

            customer.orders.push({
                products: orderProducts,
                totalAmount,
                paymentMethod,
                wholesalerId,
                status,
                trackingNumber: status === 'Shipped' || status === 'Delivered' ? `TRK${100000 + index}` : '',
                wholesalerName: 'Vildan Toptan Ticaret',
                rating: status === 'Delivered' && index % 5 === 0 ? randInt(4, 5) : 0,
                review: status === 'Delivered' && index % 5 === 0 ? 'Teslimat sorunsuz tamamlandi.' : '',
                date: daysAgo(daysBack)
            });

            if (paymentMethod === 'Cari') {
                const customerKey = customer._id.toString();
                debtByCustomerId.set(customerKey, (debtByCustomerId.get(customerKey) || 0) + totalAmount);
            }
        }

        const paymentNotifications = [];
        for (let index = 0; index < PAYMENT_NOTIFICATION_COUNT; index += 1) {
            const customer = pick(customers, index);
            const customerKey = customer._id.toString();
            const currentDebt = debtByCustomerId.get(customerKey) || 0;
            const amount = Math.min(Math.max(randInt(3500, 25000), 1000), Math.max(currentDebt, 1000));
            const status = index % 5 === 0 ? 'Pending' : index % 7 === 0 ? 'Rejected' : 'Approved';

            paymentNotifications.push({
                customerId: customer._id,
                wholesalerId,
                amount,
                receiptFile: `dekont-demo-${index + 1}.pdf`,
                status,
                createdAt: daysAgo(randInt(0, ORDER_HISTORY_DAYS - 1))
            });

            if (status === 'Approved') {
                debtByCustomerId.set(customerKey, Math.max(0, currentDebt - amount));
            }
        }

        for (const customer of customers) {
            const account = customer.wholesalerAccounts.find(
                item => item.wholesalerId.toString() === wholesalerId.toString()
            );

            if (account) {
                account.currentDebt = Math.round(debtByCustomerId.get(customer._id.toString()) || 0);
            }

            customer.markModified('orders');
            customer.markModified('wholesalerAccounts');
            await customer.save();
        }

        if (paymentNotifications.length) {
            await PaymentNotification.insertMany(paymentNotifications);
        }

        for (const product of savedProducts) {
            const soldCount = salesByProductId.get(product._id.toString()) || 0;
            const currentStock = product.wholesalers[0].stockQuantity;
            product.wholesalers[0].stockQuantity = Math.max(0, currentStock - soldCount);
            product.wholesalers[0].minStockLevel = Math.max(2, product.wholesalers[0].minStockLevel);
            await product.save();
        }

        const refreshedProducts = await Product.find({ 'wholesalers.usersID': wholesalerId });
        await User.findByIdAndUpdate(wholesalerId, {
            $set: {
                products: refreshedProducts.map(product => ({
                    productID: product._id,
                    price: product.wholesalers[0].price,
                    stockQuantity: product.wholesalers[0].stockQuantity,
                    minStockLevel: product.wholesalers[0].minStockLevel
                }))
            }
        });

        console.log(`${CUSTOMER_COUNT} bayi, ${ORDER_COUNT} siparis ve ${PAYMENT_NOTIFICATION_COUNT} odeme bildirimi olusturuldu.`);
        console.log('Örnek veriler veritabanına başarıyla yüklendi!');
        process.exit(0);
    } catch (err) {
        console.error('Hata oluştu:', err);
        process.exit(1);
    }
};

seedDatabase();
