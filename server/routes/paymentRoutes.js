const express = require('express');
const mongoose = require('mongoose');
const { PaymentNotification, User } = require('../models');
const { authenticateToken, authorizeWholesalerParam, requireWholesalerRole } = require('../utils/security');

const createPaymentRoutes = () => {
    const router = express.Router();
    router.use(authenticateToken);

    router.post('/payments/notify', async (req, res) => {
        const { customerId, wholesalerId, amount, receiptFile } = req.body;
        if (customerId?.toString() !== req.auth.userId) {
            return res.status(403).json({ message: 'You can only create payment notifications for your own account.' });
        }

        const numericAmount = Number(amount);
        if (!wholesalerId || !mongoose.Types.ObjectId.isValid(wholesalerId) || !Number.isFinite(numericAmount) || numericAmount <= 0 || !receiptFile) {
            return res.status(400).json({ message: 'Gecerli toptanci, tutar ve dekont bilgisi gereklidir.' });
        }

        try {
            const newNotification = await PaymentNotification.create({
                customerId,
                wholesalerId,
                amount: numericAmount,
                receiptFile,
                status: 'Pending'
            });
            res.status(201).json(newNotification);
        } catch (error) {
            res.status(500).json({ message: 'Odeme bildirimi kaydedilemedi.', error: error.message });
        }
    });

    router.get('/wholesalers/:id/payments', authorizeWholesalerParam('id'), requireWholesalerRole(['accounting']), async (req, res) => {
        try {
            const payments = await PaymentNotification.find({ wholesalerId: req.params.id })
                .populate('customerId', 'name email taxNumber')
                .sort({ createdAt: -1 });
            res.json(payments);
        } catch (error) {
            res.status(500).json({ message: 'Odeme bildirimleri alinamadi.', error: error.message });
        }
    });

    router.put('/payments/:id/status', requireWholesalerRole(['accounting']), async (req, res) => {
        const { status } = req.body;
        try {
            if (!['Approved', 'Rejected'].includes(status)) {
                return res.status(400).json({ message: 'Gecersiz odeme durumu.' });
            }

            const payment = await PaymentNotification.findById(req.params.id);
            if (!payment) {
                return res.status(404).json({ message: 'Odeme bildirimi bulunamadi.' });
            }

            if (payment.wholesalerId.toString() !== req.auth.userId) {
                return res.status(403).json({ message: 'You can only update payments assigned to your wholesaler account.' });
            }

            if (payment.status !== 'Pending') {
                return res.status(400).json({ message: 'Bu bildirim zaten sonuclandirilmis.' });
            }

            payment.status = status;
            await payment.save();

            if (status === 'Approved') {
                const customer = await User.findById(payment.customerId);
                if (customer) {
                    const account = customer.wholesalerAccounts.find(
                        acc => acc.wholesalerId.toString() === payment.wholesalerId.toString()
                    );
                    if (account) {
                        account.currentDebt = Math.max(0, account.currentDebt - payment.amount);
                        customer.markModified('wholesalerAccounts');
                        await customer.save();
                    }
                }
            }

            res.json(payment);
        } catch (error) {
            res.status(500).json({ message: 'Odeme durumu guncellenemedi.', error: error.message });
        }
    });

    return router;
};

module.exports = { createPaymentRoutes };
