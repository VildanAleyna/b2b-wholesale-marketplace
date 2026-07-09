const express = require('express');
const mongoose = require('mongoose');
const { User, Product } = require('../models');
const { sanitizeUser } = require('../utils/serializers');
const { authenticateToken, authorizeSelfParam, authorizeWholesalerParam, hasWholesalerRole, requireWholesalerRole } = require('../utils/security');

const createOrderRoutes = () => {
    const router = express.Router();
    router.use(authenticateToken);
    const authorizeOrderStatusActor = (req, res, next) => {
        const isOwnCustomerOrder = req.auth?.accountType === 'customer' && req.auth?.userId === req.params.customerId;
        if (isOwnCustomerOrder || hasWholesalerRole(req.auth, ['warehouse'])) {
            return next();
        }

        return res.status(403).json({ message: 'You are not authorized to update this order status.' });
    };

    const rollbackStockReservations = async (reservations) => {
        await Promise.all(reservations.map(reservation => Product.updateOne(
            {
                _id: reservation.productId,
                'wholesalers.usersID': reservation.wholesalerId
            },
            { $inc: { 'wholesalers.$.stockQuantity': reservation.count } }
        )));
    };

    const rollbackMirrorStockReservations = async (reservations) => {
        await Promise.all(reservations.map(reservation => User.updateOne(
            {
                _id: reservation.wholesalerId,
                'products.productID': reservation.productId
            },
            { $inc: { 'products.$.stockQuantity': reservation.count } }
        )));
    };

    router.post('/users/:userId/purchase', authorizeSelfParam('userId'), async (req, res) => {
        const { userId } = req.params;
        const { wholesalerId, paymentMethod, products } = req.body;
        let stockReservations = [];
        let mirrorStockReservations = [];

        try {
            if (!wholesalerId || !mongoose.Types.ObjectId.isValid(wholesalerId)) {
                return res.status(400).json({ message: 'Gecerli toptanci ID gereklidir.' });
            }

            if (!Array.isArray(products) || products.length === 0) {
                return res.status(400).json({ message: 'Siparis icin urun secilmelidir.' });
            }

            if (!['Cari', 'CreditCard'].includes(paymentMethod)) {
                return res.status(400).json({ message: 'Gecersiz odeme yontemi.' });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            const requestedItems = products.map(item => ({
                productId: item._id || item.productId,
                count: Number(item.count)
            }));

            if (requestedItems.some(item => !mongoose.Types.ObjectId.isValid(item.productId) || !Number.isInteger(item.count) || item.count <= 0)) {
                return res.status(400).json({ message: 'Siparis urunleri ve adetleri gecersiz.' });
            }

            const productIds = requestedItems.map(item => new mongoose.Types.ObjectId(item.productId));
            const productRecords = await Product.find({
                _id: { $in: productIds },
                'wholesalers.usersID': new mongoose.Types.ObjectId(wholesalerId)
            });

            if (productRecords.length !== requestedItems.length) {
                return res.status(400).json({ message: 'Sepette bu toptanciya ait olmayan veya bulunamayan urun var.' });
            }

            const discountMultiplier = user.tier === 'Gold' ? 0.8 : user.tier === 'Silver' ? 0.9 : 1;
            const orderProducts = [];
            let discountedSubtotal = 0;

            for (const item of requestedItems) {
                const product = productRecords.find(record => record._id.toString() === item.productId.toString());
                const wholesalerInfo = product.wholesalers.find(
                    wholesaler => wholesaler.usersID.toString() === wholesalerId.toString()
                );
                const minOrderQuantity = product.minOrderQuantity || 1;

                if (item.count < minOrderQuantity) {
                    return res.status(400).json({ message: `${product.title} icin minimum siparis adedi ${minOrderQuantity}.` });
                }

                if (wholesalerInfo.stockQuantity < item.count) {
                    return res.status(400).json({ message: `${product.title} icin yeterli stok yok.` });
                }

                const unitPrice = Math.round(wholesalerInfo.price * discountMultiplier);
                discountedSubtotal += unitPrice * item.count;
                orderProducts.push({
                    product,
                    wholesalerInfo,
                    orderRow: {
                        productId: product._id,
                        title: product.title,
                        image: product.image,
                        price: unitPrice,
                        count: item.count
                    }
                });
            }

            const isShippingFree = user.tier === 'Gold' || user.tier === 'Silver' || discountedSubtotal >= 5000;
            const totalAmount = discountedSubtotal + (isShippingFree ? 0 : 250);
            let cariAccount = null;

            if (paymentMethod === 'Cari') {
                cariAccount = user.wholesalerAccounts.find(
                    acc => acc.wholesalerId.toString() === wholesalerId.toString()
                );

                if (!cariAccount) {
                    return res.status(400).json({ message: 'Bu toptanci ile aktif bir cari hesabi bulunmuyor.' });
                }

                const remainingLimit = cariAccount.creditLimit - cariAccount.currentDebt;
                if (totalAmount > remainingLimit) {
                    return res.status(400).json({ message: `Yetersiz cari limit. Siparis tutari: ${totalAmount} TL, kalan limit: ${remainingLimit} TL` });
                }
            }

            let wholesalerName = 'Toptanci Magazasi';
            if (wholesalerId) {
                const wholesalerObj = await User.findById(wholesalerId);
                if (wholesalerObj) {
                    wholesalerName = wholesalerObj.name;
                }
            }

            const newOrder = {
                products: orderProducts.map(item => item.orderRow),
                totalAmount,
                paymentMethod,
                wholesalerId: new mongoose.Types.ObjectId(wholesalerId),
                wholesalerName,
                status: 'Pending',
                date: new Date()
            };

            for (const { product, wholesalerInfo, orderRow } of orderProducts) {
                const stockUpdate = await Product.updateOne(
                    {
                        _id: product._id,
                        wholesalers: {
                            $elemMatch: {
                                usersID: new mongoose.Types.ObjectId(wholesalerId),
                                stockQuantity: { $gte: orderRow.count }
                            }
                        }
                    },
                    { $inc: { 'wholesalers.$.stockQuantity': -orderRow.count } }
                );

                if (stockUpdate.modifiedCount !== 1) {
                    await rollbackStockReservations(stockReservations);
                    return res.status(409).json({ message: `${orderRow.title} icin stok ayni anda degismis olabilir. Lutfen sepeti yenileyin.` });
                }

                wholesalerInfo.stockQuantity -= orderRow.count;
                stockReservations.push({
                    productId: product._id,
                    wholesalerId: new mongoose.Types.ObjectId(wholesalerId),
                    count: orderRow.count
                });
            }

            if (cariAccount) {
                cariAccount.currentDebt += totalAmount;
                user.markModified('wholesalerAccounts');
            }

            user.orders.push(newOrder);

            const totalSpent = user.orders.reduce((sum, order) => sum + order.totalAmount, 0);
            user.tier = totalSpent >= 100000 ? 'Gold' : totalSpent >= 20000 ? 'Silver' : 'Bronze';

            for (const { product, orderRow } of orderProducts) {
                const mirrorUpdate = await User.updateOne(
                    { _id: wholesalerId, 'products.productID': product._id },
                    { $inc: { 'products.$.stockQuantity': -orderRow.count } }
                );

                if (mirrorUpdate.modifiedCount !== 1) {
                    throw new Error('Toptanci stok aynasi guncellenemedi.');
                }

                mirrorStockReservations.push({
                    productId: product._id,
                    wholesalerId: new mongoose.Types.ObjectId(wholesalerId),
                    count: orderRow.count
                });
            }

            await user.save();

            res.status(201).json({ message: 'Siparis basariyla olusturuldu.', user: sanitizeUser(user) });
        } catch (error) {
            if (stockReservations.length > 0) {
                await rollbackStockReservations(stockReservations);
            }
            if (mirrorStockReservations.length > 0) {
                await rollbackMirrorStockReservations(mirrorStockReservations);
            }
            res.status(500).json({ message: 'Siparis islenirken hata olustu.', error: error.message });
        }
    });

    router.get('/users/:userId/orders', authorizeSelfParam('userId'), async (req, res) => {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }
            res.json(user.orders || []);
        } catch (error) {
            res.status(500).json({ message: 'Siparis gecmisi alinamadi.', error: error.message });
        }
    });

    router.get('/wholesalers/:wholesalerId/orders', authorizeWholesalerParam('wholesalerId'), requireWholesalerRole(['warehouse', 'sales']), async (req, res) => {
        try {
            const customers = await User.find({ 'orders.wholesalerId': req.params.wholesalerId });

            const wholesalerOrders = [];
            customers.forEach(customer => {
                customer.orders.forEach(order => {
                    if (order.wholesalerId && order.wholesalerId.toString() === req.params.wholesalerId) {
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

            wholesalerOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
            res.json(wholesalerOrders);
        } catch (error) {
            res.status(500).json({ message: 'Gelen siparisler alinamadi.', error: error.message });
        }
    });

    router.put('/customers/:customerId/orders/:orderId/status', authorizeOrderStatusActor, async (req, res) => {
        const { customerId, orderId } = req.params;
        const { status, trackingNumber } = req.body;

        try {
            if (!['Pending', 'Preparing', 'Shipped', 'Delivered'].includes(status)) {
                return res.status(400).json({ message: 'Gecersiz siparis durumu.' });
            }

            const customer = await User.findById(customerId);
            if (!customer) {
                return res.status(404).json({ message: 'Musteri bulunamadi.' });
            }

            const order = customer.orders.find(item => item._id.toString() === orderId);
            if (!order) {
                return res.status(404).json({ message: 'Siparis bulunamadi.' });
            }

            const isCustomerConfirmingDelivery = (
                req.auth.accountType === 'customer' &&
                req.auth.userId === customerId &&
                status === 'Delivered' &&
                order.status === 'Shipped'
            );

            if (isCustomerConfirmingDelivery) {
                if (trackingNumber !== undefined && trackingNumber !== order.trackingNumber) {
                    return res.status(400).json({ message: 'Teslim alma onayinda kargo takip numarasi degistirilemez.' });
                }
            } else {
                if (!hasWholesalerRole(req.auth, ['warehouse'])) {
                    return res.status(403).json({ message: 'This employee role is not allowed for this operation.' });
                }

                if (order.wholesalerId?.toString() !== req.auth.userId) {
                    return res.status(403).json({ message: 'You can only update orders assigned to your wholesaler account.' });
                }
            }

            order.status = status;
            if (trackingNumber !== undefined) {
                order.trackingNumber = trackingNumber;
            }

            customer.markModified('orders');
            await customer.save();

            res.json({ message: 'Siparis durumu basariyla guncellendi.', order });
        } catch (error) {
            res.status(500).json({ message: 'Siparis durumu guncellenemedi.', error: error.message });
        }
    });

    router.put('/customers/:customerId/orders/:orderId/rate', authorizeSelfParam('customerId'), async (req, res) => {
        const { customerId, orderId } = req.params;
        const { rating, review } = req.body;

        try {
            const numericRating = Number(rating);
            if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
                return res.status(400).json({ message: 'Puan 1 ile 5 arasinda olmalidir.' });
            }

            const customer = await User.findById(customerId);
            if (!customer) {
                return res.status(404).json({ message: 'Musteri bulunamadi.' });
            }

            const order = customer.orders.find(item => item._id.toString() === orderId);
            if (!order) {
                return res.status(404).json({ message: 'Siparis bulunamadi.' });
            }

            order.rating = numericRating;
            if (review !== undefined) {
                order.review = review;
            }

            if (order.wholesalerId) {
                const wholesaler = await User.findById(order.wholesalerId);
                if (wholesaler) {
                    const allCustomers = await User.find({ 'orders.wholesalerId': order.wholesalerId });
                    let sum = 0;
                    let count = 0;

                    allCustomers.forEach(account => {
                        account.orders.forEach(item => {
                            if (item.wholesalerId && item.wholesalerId.toString() === order.wholesalerId.toString()) {
                                const itemRating = item._id.toString() === orderId ? numericRating : (item.rating || 0);
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

            res.json({ message: 'Degerlendirme basariyla kaydedildi.', order });
        } catch (error) {
            res.status(500).json({ message: 'Degerlendirme kaydedilemedi.', error: error.message });
        }
    });

    return router;
};

module.exports = { createOrderRoutes };
