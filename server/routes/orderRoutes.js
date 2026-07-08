const express = require('express');
const mongoose = require('mongoose');
const { User } = require('../models');
const { sanitizeUser } = require('../utils/serializers');
const { authenticateToken, authorizeSelfParam, authorizeWholesalerParam } = require('../utils/security');

const createOrderRoutes = () => {
    const router = express.Router();
    router.use(authenticateToken);

    router.post('/users/:userId/purchase', authorizeSelfParam('userId'), async (req, res) => {
        const { userId } = req.params;
        const { wholesalerId, totalAmount, paymentMethod, products } = req.body;

        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            if (paymentMethod === 'Cari') {
                if (!wholesalerId) {
                    return res.status(400).json({ message: 'Cari odemesi icin toptanci ID gereklidir.' });
                }

                const account = user.wholesalerAccounts.find(
                    acc => acc.wholesalerId.toString() === wholesalerId.toString()
                );

                if (!account) {
                    return res.status(400).json({ message: 'Bu toptanci ile aktif bir cari hesabi bulunmuyor.' });
                }

                const remainingLimit = account.creditLimit - account.currentDebt;
                if (totalAmount > remainingLimit) {
                    return res.status(400).json({ message: `Yetersiz cari limit. Siparis tutari: ${totalAmount} TL, kalan limit: ${remainingLimit} TL` });
                }

                account.currentDebt += totalAmount;
                user.markModified('wholesalerAccounts');
            }

            let wholesalerName = 'Toptanci Magazasi';
            if (wholesalerId) {
                const wholesalerObj = await User.findById(wholesalerId);
                if (wholesalerObj) {
                    wholesalerName = wholesalerObj.name;
                }
            }

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
                status: 'Pending',
                date: new Date()
            };

            user.orders.push(newOrder);

            const totalSpent = user.orders.reduce((sum, order) => sum + order.totalAmount, 0);
            user.tier = totalSpent >= 100000 ? 'Gold' : totalSpent >= 20000 ? 'Silver' : 'Bronze';

            await user.save();
            res.status(201).json({ message: 'Siparis basariyla olusturuldu.', user: sanitizeUser(user) });
        } catch (error) {
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

    router.get('/wholesalers/:wholesalerId/orders', authorizeWholesalerParam('wholesalerId'), async (req, res) => {
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

    router.put('/customers/:customerId/orders/:orderId/status', async (req, res) => {
        const { customerId, orderId } = req.params;
        const { status, trackingNumber } = req.body;

        try {
            const customer = await User.findById(customerId);
            if (!customer) {
                return res.status(404).json({ message: 'Musteri bulunamadi.' });
            }

            const order = customer.orders.find(item => item._id.toString() === orderId);
            if (!order) {
                return res.status(404).json({ message: 'Siparis bulunamadi.' });
            }

            if (order.wholesalerId?.toString() !== req.auth.userId) {
                return res.status(403).json({ message: 'You can only update orders assigned to your wholesaler account.' });
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
            const customer = await User.findById(customerId);
            if (!customer) {
                return res.status(404).json({ message: 'Musteri bulunamadi.' });
            }

            const order = customer.orders.find(item => item._id.toString() === orderId);
            if (!order) {
                return res.status(404).json({ message: 'Siparis bulunamadi.' });
            }

            order.rating = rating;
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
                                const itemRating = item._id.toString() === orderId ? rating : (item.rating || 0);
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
