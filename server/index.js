const express = require('express');
const cors = require('cors');
const { loadEnvFile: loadEnvFromFile } = require('./config/env');
const { connectDB: connectDatabase } = require('./config/database');
const { formatCurrency: formatCurrencyValue } = require('./utils/formatters');
const { hashPassword: hashUserPassword, comparePassword, createAuthToken } = require('./utils/security');
const { Product, User, PaymentNotification } = require('./models');
const { createAuthRoutes } = require('./routes/authRoutes');
const { createCatalogRoutes } = require('./routes/catalogRoutes');
const { createProfileRoutes } = require('./routes/profileRoutes');
const { createAccountingRoutes } = require('./routes/accountingRoutes');
const { createPaymentRoutes } = require('./routes/paymentRoutes');
const { createOrderRoutes } = require('./routes/orderRoutes');
const { createEmployeeRoutes } = require('./routes/employeeRoutes');
const { createInsightRoutes } = require('./routes/insightRoutes');

loadEnvFromFile();

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/Toptanci';
const corsOrigin = process.env.CORS_ORIGIN || '*';

const hashPassword = hashUserPassword;

connectDatabase(mongoUri);

// CORS Middleware
app.use(cors({ origin: corsOrigin }));

// Middleware
app.use(express.json());

const formatCurrency = formatCurrencyValue;

const getWholesalerOrders = async (wholesalerId) => {
    const customers = await User.find({ 'orders.wholesalerId': wholesalerId }).select('name email orders');
    const orders = [];

    customers.forEach((customer) => {
        (customer.orders || []).forEach((order) => {
            if (order.wholesalerId?.toString() === wholesalerId.toString()) {
                orders.push({
                    customerId: customer._id,
                    customerName: customer.name,
                    customerEmail: customer.email,
                    ...(order.toObject?.() || order),
                });
            }
        });
    });

    return orders;
};

const buildWholesalerInsights = async (wholesalerId) => {
    const [products, orders, payments, customers] = await Promise.all([
        Product.find({ 'wholesalers.usersID': wholesalerId }),
        getWholesalerOrders(wholesalerId),
        PaymentNotification.find({ wholesalerId }),
        User.find({
            wholesaler: false,
            $or: [
                { 'wholesalerAccounts.wholesalerId': wholesalerId },
                { 'orders.wholesalerId': wholesalerId }
            ]
        }).select('name email wholesalerAccounts orders')
    ]);

    const stockRows = products.map((product) => {
        const stockInfo = product.wholesalers.find(
            item => item.usersID.toString() === wholesalerId.toString()
        ) || product.wholesalers[0];

        return {
            productId: product._id,
            title: product.title,
            stock: stockInfo?.stockQuantity || 0,
            minStock: stockInfo?.minStockLevel || 0,
            price: stockInfo?.price || 0,
        };
    });

    const lowStockProducts = stockRows
        .filter(item => item.stock <= item.minStock)
        .sort((a, b) => a.stock - b.stock);
    const outOfStockProducts = stockRows.filter(item => item.stock <= 0);
    const pendingOrders = orders.filter(order => order.status === 'Pending');
    const preparingOrders = orders.filter(order => order.status === 'Preparing');
    const shippedOrders = orders.filter(order => order.status === 'Shipped');
    const activeOrders = orders.filter(order => ['Pending', 'Preparing', 'Shipped'].includes(order.status));
    const pendingPayments = payments.filter(payment => payment.status === 'Pending');

    const riskyAccounts = customers.map((customer) => {
        const account = (customer.wholesalerAccounts || []).find(
            item => item.wholesalerId?.toString() === wholesalerId.toString()
        );
        const creditLimit = account?.creditLimit || 0;
        const currentDebt = account?.currentDebt || 0;
        const usage = creditLimit > 0 ? Math.round((currentDebt / creditLimit) * 100) : 0;

        return {
            customerId: customer._id,
            customerName: customer.name,
            creditLimit,
            currentDebt,
            usage,
        };
    }).filter(account => account.usage >= 80)
      .sort((a, b) => b.usage - a.usage);

    const alerts = [];

    if (outOfStockProducts.length) {
        alerts.push({
            type: 'stock',
            severity: 'high',
            title: 'Stokta tükenen ürün var',
            message: `${outOfStockProducts.length} ürünün stoğu tükendi. Satış kaybı yaşamamak için satın alma/tedarik kontrolü önerilir.`,
            action: 'Stok ekranından ürünleri güncelle',
            metric: `${outOfStockProducts.length} ürün`,
        });
    }

    if (lowStockProducts.length) {
        alerts.push({
            type: 'stock',
            severity: outOfStockProducts.length ? 'medium' : 'high',
            title: 'Kritik stok takibi',
            message: `${lowStockProducts[0].title} dahil ${lowStockProducts.length} ürün minimum stok seviyesinde veya altında.`,
            action: 'Minimum stok ve mevcut stok değerlerini kontrol et',
            metric: `${lowStockProducts.length} ürün`,
        });
    }

    if (pendingOrders.length) {
        alerts.push({
            type: 'order',
            severity: 'high',
            title: 'Hazırlama bekleyen siparişler',
            message: `${pendingOrders.length} yeni sipariş işlem bekliyor. Depo ekibinin hazırlama sürecini başlatması gerekir.`,
            action: 'Gelen siparişleri önceliklendir',
            metric: `${pendingOrders.length} sipariş`,
        });
    }

    if (preparingOrders.length || shippedOrders.length) {
        alerts.push({
            type: 'order',
            severity: 'medium',
            title: 'Aktif operasyon yükü',
            message: `${activeOrders.length} sipariş hazırlama/kargo/teslimat sürecinde takip ediliyor.`,
            action: 'Kargo ve teslimat durumlarını güncel tut',
            metric: `${activeOrders.length} aktif`,
        });
    }

    if (pendingPayments.length) {
        const totalPending = pendingPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        alerts.push({
            type: 'payment',
            severity: 'medium',
            title: 'Onay bekleyen ödemeler',
            message: `${formatCurrency(totalPending)} tutarında ${pendingPayments.length} ödeme bildirimi muhasebe onayı bekliyor.`,
            action: 'Dekontları kontrol edip cari hesaba işle',
            metric: formatCurrency(totalPending),
        });
    }

    if (riskyAccounts.length) {
        alerts.push({
            type: 'account',
            severity: 'high',
            title: 'Cari limit riski',
            message: `${riskyAccounts[0].customerName} dahil ${riskyAccounts.length} bayi cari limitinin %80 ve üzerini kullanıyor.`,
            action: 'Tahsilat ve yeni sipariş riskini kontrol et',
            metric: `${riskyAccounts.length} bayi`,
        });
    }

    if (!alerts.length) {
        alerts.push({
            type: 'general',
            severity: 'success',
            title: 'Operasyon dengeli görünüyor',
            message: 'Kritik stok, bekleyen ödeme veya yüksek cari risk tespit edilmedi.',
            action: 'Günlük kontrole devam et',
            metric: 'Normal',
        });
    }

    return {
        scope: 'wholesaler',
        generatedAt: new Date(),
        summary: {
            productCount: products.length,
            lowStockCount: lowStockProducts.length,
            outOfStockCount: outOfStockProducts.length,
            activeOrderCount: activeOrders.length,
            pendingOrderCount: pendingOrders.length,
            pendingPaymentCount: pendingPayments.length,
            riskyCustomerCount: riskyAccounts.length,
        },
        highlights: {
            lowStockProducts: lowStockProducts.slice(0, 5),
            riskyAccounts: riskyAccounts.slice(0, 5),
        },
        alerts,
    };
};

const buildCustomerInsights = async (userId) => {
    const customer = await User.findById(userId);
    if (!customer) {
        return null;
    }

    const payments = await PaymentNotification.find({ customerId: userId });
    const orders = customer.orders || [];
    const activeOrders = orders.filter(order => ['Pending', 'Preparing', 'Shipped'].includes(order.status));
    const shippedOrders = orders.filter(order => order.status === 'Shipped');
    const pendingPayments = payments.filter(payment => payment.status === 'Pending');
    const rejectedPayments = payments.filter(payment => payment.status === 'Rejected');
    const alerts = [];

    (customer.wholesalerAccounts || []).forEach((account) => {
        const creditLimit = account.creditLimit || 0;
        const currentDebt = account.currentDebt || 0;
        const remaining = creditLimit - currentDebt;
        const usage = creditLimit > 0 ? Math.round((currentDebt / creditLimit) * 100) : 0;

        if (usage >= 80) {
            alerts.push({
                type: 'account',
                severity: 'high',
                title: 'Cari limit kullanımınız yüksek',
                message: `Cari limitinizin %${usage} oranı kullanılmış. Yeni sipariş öncesi ödeme planı yapmanız faydalı olur.`,
                action: 'Cari hesap ekranından ödeme bildirimi gönder',
                metric: `${formatCurrency(remaining)} kalan`,
            });
        } else if (usage >= 60) {
            alerts.push({
                type: 'account',
                severity: 'medium',
                title: 'Cari limit takibi',
                message: `Cari limitinizin %${usage} oranı kullanılmış. Sipariş planınızı kalan limite göre yapabilirsiniz.`,
                action: 'Kalan limitinizi kontrol edin',
                metric: `${formatCurrency(remaining)} kalan`,
            });
        }
    });

    if (activeOrders.length) {
        alerts.push({
            type: 'order',
            severity: 'info',
            title: 'Aktif siparişleriniz var',
            message: `${activeOrders.length} siparişiniz hazırlama/kargo sürecinde takip ediliyor.`,
            action: 'Sipariş geçmişinden durumları izleyin',
            metric: `${activeOrders.length} sipariş`,
        });
    }

    if (shippedOrders.length) {
        alerts.push({
            type: 'delivery',
            severity: 'medium',
            title: 'Teslimat takibi',
            message: `${shippedOrders.length} sipariş kargoda görünüyor. Ürün teslim edildiğinde siparişi onaylayabilirsiniz.`,
            action: 'Kargo takip numarasını kontrol edin',
            metric: `${shippedOrders.length} kargo`,
        });
    }

    if (pendingPayments.length) {
        alerts.push({
            type: 'payment',
            severity: 'medium',
            title: 'Ödeme bildirimi onay bekliyor',
            message: `${pendingPayments.length} ödeme bildiriminiz toptancı onayı bekliyor.`,
            action: 'Muhasebe onayını bekleyin',
            metric: `${pendingPayments.length} bildirim`,
        });
    }

    if (rejectedPayments.length) {
        alerts.push({
            type: 'payment',
            severity: 'high',
            title: 'Reddedilen ödeme bildirimi',
            message: `${rejectedPayments.length} ödeme bildirimi reddedilmiş. Dekont veya tutar bilgisini kontrol edin.`,
            action: 'Yeni ödeme bildirimi gönderin',
            metric: `${rejectedPayments.length} red`,
        });
    }

    if (!alerts.length) {
        alerts.push({
            type: 'general',
            severity: 'success',
            title: 'Bayi hesabınız dengeli',
            message: 'Aktif risk, bekleyen ödeme veya kritik cari limit uyarısı bulunmuyor.',
            action: 'Yeni ürün ve kampanyaları inceleyin',
            metric: 'Normal',
        });
    }

    return {
        scope: 'customer',
        generatedAt: new Date(),
        summary: {
            activeOrderCount: activeOrders.length,
            pendingPaymentCount: pendingPayments.length,
            rejectedPaymentCount: rejectedPayments.length,
            accountCount: customer.wholesalerAccounts?.length || 0,
        },
        alerts,
    };
};

app.use(createAuthRoutes({ hashPassword, comparePassword, createAuthToken }));
app.use(createCatalogRoutes());
app.use(createProfileRoutes({ hashPassword }));
app.use(createAccountingRoutes());
app.use(createPaymentRoutes());
app.use(createOrderRoutes());
app.use(createEmployeeRoutes({ hashPassword }));
app.use(createInsightRoutes({ buildWholesalerInsights, buildCustomerInsights }));
// Server'ı başlat
app.listen(port, () => {
    console.log(`Server ${port} numaralı portta çalışıyor.`);
});
