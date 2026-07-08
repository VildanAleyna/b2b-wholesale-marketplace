const express = require('express');
const mongoose = require('mongoose');
const { User, PaymentNotification } = require('../models');
const { sanitizeUser } = require('../utils/serializers');
const { authenticateToken } = require('../utils/security');

const createAccountingRoutes = () => {
    const router = express.Router();
    router.use(authenticateToken);

    router.get('/users/:userId/accounts', async (req, res) => {
        try {
            const user = await User.findById(req.params.userId).populate('wholesalerAccounts.wholesalerId', 'name email address phone taxNumber');
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }
            res.json(user.wholesalerAccounts || []);
        } catch (error) {
            res.status(500).json({ message: 'Cari hesaplar alinamadi.', error: error.message });
        }
    });

    router.get('/wholesalers/:id/accounts', async (req, res) => {
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
                const orderDebt = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                const currentDebt = account?.currentDebt || orderDebt;
                const creditLimit = account?.creditLimit || 0;

                return {
                    customer: sanitizeUser(customer),
                    creditLimit,
                    currentDebt,
                    remainingLimit: creditLimit - currentDebt,
                    orderCount: orders.length,
                    totalOrderAmount: orderDebt,
                    approvedPaymentTotal: approvedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
                    pendingPaymentTotal: pendingPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
                    lastOrderDate: orders.length ? orders.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null,
                };
            });

            res.json(accounts);
        } catch (error) {
            res.status(500).json({ message: 'Bayi cari hesaplari alinamadi.', error: error.message });
        }
    });

    router.get('/users/:userId/statement', async (req, res) => {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            const orderRows = (user.orders || []).map(order => ({
                _id: order._id,
                date: order.date,
                type: 'Siparis',
                description: order.paymentMethod === 'Cari' ? 'Cari siparis alimi' : 'Kredi karti ile siparis',
                amount: order.totalAmount,
                effect: 'debit',
                reference: order._id
            }));

            const approvedPayments = await PaymentNotification.find({
                customerId: req.params.userId,
                status: 'Approved'
            });

            const paymentRows = approvedPayments.map(pay => ({
                _id: pay._id,
                date: pay.createdAt || pay.date,
                type: 'Odeme',
                description: `EFT/Havale Bildirimi (${pay.receiptFile || 'Dekont'})`,
                amount: pay.amount,
                effect: 'credit',
                reference: pay._id
            }));

            const statement = [...orderRows, ...paymentRows].sort((a, b) => new Date(b.date) - new Date(a.date));
            res.json(statement);
        } catch (error) {
            res.status(500).json({ message: 'Cari ekstre dokumu olusturulamadi.', error: error.message });
        }
    });

    return router;
};

module.exports = { createAccountingRoutes };
