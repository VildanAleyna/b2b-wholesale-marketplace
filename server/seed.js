const mongoose = require('mongoose');
const crypto = require('crypto');

// MongoDB Bağlantısı
const MONGO_URI = 'mongodb://localhost:27017/Toptanci';

const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

const seedDatabase = async () => {
    try {
        console.log('MongoDB\'ye bağlanılıyor...');
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB bağlantısı başarılı.');

        // Koleksiyonları temizle
        await mongoose.connection.db.dropDatabase();
        console.log('Eski veritabanı temizlendi.');

        // Modelleri tanımla (server/index.js ile birebir uyumlu)
        const Category = mongoose.model('Category', new mongoose.Schema({
            name: String,
            image: String,
            modelIds: [mongoose.Schema.Types.ObjectId]
        }));

        const Model = mongoose.model('Model', new mongoose.Schema({
            name: String,
            brandIds: [mongoose.Schema.Types.ObjectId]
        }));

        const Brand = mongoose.model('Brand', new mongoose.Schema({
            name: { type: String, required: true },
            productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
        }));

        const Product = mongoose.model('Product', new mongoose.Schema({
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
        }));

        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            password: String,
            taxNumber: String,
            wholesaler: Boolean,
            address: String,
            phone: String,
            wholesalerAccounts: [Object],
            employee: [Object],
            favorites: [mongoose.Schema.Types.ObjectId],
            products: [Object]
        }));

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
                wholesalerAccounts: [
                    {
                        wholesalerId: wholesalerId,
                        creditLimit: 150000,
                        currentDebt: 45000
                    }
                ]
            }
        ]);
        console.log('Kullanıcılar oluşturuldu.');

        // 2. Markaları Oluştur
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

        // 5. Ürünleri Oluştur (Tam 24 Adet)
        const productsData = [
            // Sayfa 1
            {
                title: 'Stanley Klasik Vakumlu Termos 1.4 L',
                categoryId: catMutfak._id,
                modelId: modelTermos._id,
                brandId: brandStanley._id,
                image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=400',
                price: 1850,
                stock: 120,
                desc: 'Çift katmanlı paslanmaz çelik vakum yalıtımı ile sıcak/soğuk tutar.'
            },
            {
                title: 'Dyson V15 Detect Kablosuz Süpürge',
                categoryId: catElektronik._id,
                modelId: modelSupurge._id,
                brandId: brandDyson._id,
                image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=400',
                price: 24500,
                stock: 15,
                desc: 'Lazer aydınlatmalı ve akıllı emiş gücü ayarlı kablosuz dikey süpürge.'
            },
            {
                title: 'Xiaomi Redmi Note 13 Pro 256GB',
                categoryId: catElektronik._id,
                modelId: modelTelefon._id,
                brandId: brandXiaomi._id,
                image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=400',
                price: 14500,
                stock: 45,
                desc: '200 MP kamera ve AMOLED ekran özellikli akıllı telefon.'
            },
            {
                title: 'Karaca Hatır Hüp Türk Kahve Makinesi',
                categoryId: catMutfak._id,
                modelId: modelKahveci._id,
                brandId: brandKaraca._id,
                image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400',
                price: 2100,
                stock: 60,
                desc: 'Köz tadında ağır ağır pişirme ve taşma önleyici akıllı sensör.'
            },
            {
                title: 'Stanley Trigger Action Seyahat Bardağı 0.47 L',
                categoryId: catMutfak._id,
                modelId: modelTermos._id,
                brandId: brandStanley._id,
                image: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=400',
                price: 1100,
                stock: 150,
                desc: 'Tek elle açılıp kapanabilen sızdırmaz seyahat bardağı.'
            },
            {
                title: 'Dyson Airwrap Multi-Styler Saç Şekillendirici',
                categoryId: catBakim._id, // Kişisel Bakım
                modelId: modelAirwrap._id,
                brandId: brandDyson._id,
                image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400',
                price: 18900,
                stock: 20,
                desc: 'Aşırı ısı olmadan Coanda etkisiyle saçları şekillendirir ve kurutur.'
            },
            {
                title: 'Xiaomi Roborock S8 Akıllı Robot Süpürge',
                categoryId: catElektronik._id,
                modelId: modelRobot._id,
                brandId: brandXiaomi._id,
                image: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=400',
                price: 21500,
                stock: 30,
                desc: '6000 Pa emiş gücü ve çift fırçalı derinlemesine zemin temizliği.'
            },
            {
                title: 'Karaca Bio Granit Tost Makinesi',
                categoryId: catMutfak._id,
                modelId: modelTost._id,
                brandId: brandKaraca._id,
                image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=400',
                price: 2400,
                stock: 80,
                desc: 'Granit kaplama plakalar ve 180 derece açılabilen gövde.'
            },
            // Sayfa 2
            {
                title: 'Stanley Adventure Seyahat Matarası 0.23 L',
                categoryId: catMutfak._id,
                modelId: modelTermos._id,
                brandId: brandStanley._id,
                image: 'https://images.unsplash.com/photo-1619551486243-15e078b5463f?q=80&w=400',
                price: 950,
                stock: 90,
                desc: 'Paslanmaz çelik, sızdırmaz cep tipi klasik matara.'
            },
            {
                title: 'Dyson Purifier Hot+Cool Hava Temizleyici',
                categoryId: catElektronik._id,
                modelId: modelSupurge._id,
                brandId: brandDyson._id,
                image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=400',
                price: 28500,
                stock: 10,
                desc: 'HEPA filtreli hava temizleme, ısıtma ve vantilatör özellikli cihaz.'
            },
            {
                title: 'Xiaomi 20000mAh Hızlı Şarj Powerbank',
                categoryId: catElektronik._id,
                modelId: modelPowerbank._id,
                brandId: brandXiaomi._id,
                image: 'https://images.unsplash.com/photo-1609592424085-f5b244799017?q=80&w=400',
                price: 1200,
                stock: 200,
                desc: 'Çift USB çıkışlı 18W hızlı şarj destekli taşınabilir batarya.'
            },
            {
                title: 'Karaca Çelik Çaydanlık Takımı',
                categoryId: catMutfak._id,
                modelId: modelTeapot._id,
                brandId: brandKaraca._id,
                image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400',
                price: 1550,
                stock: 70,
                desc: 'Paslanmaz çelik gövde ve ısıya dayanıklı kulp tasarımı.'
            },
            {
                title: 'Philips Airfryer XXL Fritöz',
                categoryId: catMutfak._id,
                modelId: modelAirfryer._id,
                brandId: brandPhilips._id,
                image: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?q=80&w=400',
                price: 7400,
                stock: 40,
                desc: 'Sıcak hava sirkülasyonu ile yağsız çıtır pişirme teknolojisi.'
            },
            {
                title: 'Philips Daily Collection Blender',
                categoryId: catMutfak._id,
                modelId: modelBlender._id,
                brandId: brandPhilips._id,
                image: 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?q=80&w=400',
                price: 2200,
                stock: 110,
                desc: 'Cam sürahili, buz kırma özellikli güçlü mutfak blenderı.'
            },
            {
                title: 'Apple iPhone 15 Pro 128GB',
                categoryId: catElektronik._id,
                modelId: modelTelefon._id,
                brandId: brandApple._id,
                image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=400',
                price: 69900,
                stock: 25,
                desc: 'Titanyum kasa tasarımı, A17 Pro çip ve profesyonel kamera sistemi.'
            },
            {
                title: 'Apple iPad Air 5. Nesil',
                categoryId: catElektronik._id,
                modelId: modelTablet._id,
                brandId: brandApple._id,
                image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400',
                price: 24500,
                stock: 35,
                desc: 'Apple M1 çipli, Liquid Retina ekranlı ultra taşınabilir tablet.'
            },
            // Sayfa 3
            {
                title: 'Apple AirPods Pro 2. Nesil',
                categoryId: catSes._id, // Ses Sistemleri
                modelId: modelAirPods._id,
                brandId: brandApple._id,
                image: 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?q=80&w=400',
                price: 8200,
                stock: 100,
                desc: 'Aktif gürültü engelleme ve adaptif şeffaf mod özellikli kulaklık.'
            },
            {
                title: 'Samsung Galaxy S24 Ultra 512GB',
                categoryId: catElektronik._id,
                modelId: modelTelefon._id,
                brandId: brandSamsung._id,
                image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=400',
                price: 68900,
                stock: 18,
                desc: 'Entegre S-Pen, yapay zeka fotoğraf özellikleri ve titanyum gövde.'
            },
            {
                title: 'Samsung 55 inç 4K Ultra HD Smart TV',
                categoryId: catElektronik._id,
                modelId: modelTV._id,
                brandId: brandSamsung._id,
                image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=400',
                price: 22400,
                stock: 12,
                desc: 'QLED ekran teknolojisi ve dahili uydu alıcılı akıllı televizyon.'
            },
            {
                title: 'JBL Flip 6 Bluetooth Hoparlör',
                categoryId: catSes._id, // Ses Sistemleri
                modelId: modelSpeaker._id,
                brandId: brandJbl._id,
                image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=400',
                price: 4500,
                stock: 85,
                desc: 'Suya ve toza dayanıklı IP67 gövdeli taşınabilir kablosuz hoparlör.'
            },
            {
                title: 'JBL Tune 510BT Kablosuz Kulaklık',
                categoryId: catSes._id, // Ses Sistemleri
                modelId: modelAirPods._id,
                brandId: brandJbl._id,
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400',
                price: 1850,
                stock: 140,
                desc: '40 saate kadar pil ömrü ve saf bas ses kalitesine sahip kulaklık.'
            },
            {
                title: 'Philips Sonicare Şarjlı Diş Fırçası',
                categoryId: catBakim._id, // Kişisel Bakım
                modelId: modelToothbrush._id,
                brandId: brandPhilips._id,
                image: 'https://images.unsplash.com/photo-1559599141-3815480a827b?q=80&w=400',
                price: 2950,
                stock: 95,
                desc: 'Sonik temizleme teknolojisi ile plakları derinlemesine temizler.'
            },
            {
                title: 'Xiaomi Redmi Buds 5 Kulaklık',
                categoryId: catSes._id, // Ses Sistemleri
                modelId: modelAirPods._id,
                brandId: brandXiaomi._id,
                image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=400',
                price: 950,
                stock: 160,
                desc: 'Aktif gürültü engelleme (ANC) ve ergonomik silikonlu tasarım.'
            },
            {
                title: 'Philips Azur Buharlı Ütü',
                categoryId: catElektronik._id,
                modelId: modelIron._id,
                brandId: brandPhilips._id,
                image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=400',
                price: 3800,
                stock: 50,
                desc: 'SteamGlide Elite tabanlı, yüksek buhar çıkış gücüne sahip ütü.'
            }
        ];

        // Ürünleri tek tek oluşturup kaydet
        const savedProducts = [];
        for (const prodData of productsData) {
            const product = new Product({
                title: prodData.title,
                categoryId: prodData.categoryId,
                modelId: prodData.modelId,
                brandId: prodData.brandId,
                image: prodData.image,
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
        console.log('24 Ürün başarıyla oluşturuldu.');

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
        console.log('Örnek veriler veritabanına başarıyla yüklendi! 🎉');
        process.exit(0);
    } catch (err) {
        console.error('Hata oluştu:', err);
        process.exit(1);
    }
};

seedDatabase();
