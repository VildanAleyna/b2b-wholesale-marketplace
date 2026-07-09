const express = require('express');
const mongoose = require('mongoose');
const { User, Product } = require('../models');
const { sanitizeUser } = require('../utils/serializers');
const { authenticateToken, authorizeSelfParam, authorizeWholesalerParam } = require('../utils/security');

const createProfileRoutes = ({ hashPassword }) => {
    const router = express.Router();
    router.use(authenticateToken);

    router.put('/users/:id', authorizeSelfParam('id'), async (req, res) => {
        try {
            const allowedFields = [
                'name',
                'companyName',
                'authorizedPerson',
                'taxNumber',
                'taxOffice',
                'address',
                'phone',
                'notificationEmail',
                'notificationLimitWarning'
            ];
            const updateFields = {};

            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updateFields[field] = req.body[field];
                }
            });

            if (req.body.password) {
                updateFields.password = hashPassword(req.body.password);
            }

            if (Object.keys(updateFields).length === 0) {
                return res.status(400).json({ message: 'Guncellenecek gecerli alan bulunamadi.' });
            }

            const user = await User.findByIdAndUpdate(
                req.params.id,
                { $set: updateFields },
                { new: true, runValidators: true }
            );
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }
            res.json(sanitizeUser(user));
        } catch (error) {
            res.status(500).json({ message: 'Kullanici guncellenemedi.', error: error.message });
        }
    });

    router.get('/users/:id', authorizeSelfParam('id'), async (req, res) => {
        try {
            const product = await Product.findOneAndUpdate(
                {
                    _id: productId,
                    'wholesalers.usersID': req.params.id
                },
                {
                    $set: {
                        'wholesalers.$.price': numericPrice,
                        'wholesalers.$.stockQuantity': numericStock,
                        'wholesalers.$.minStockLevel': numericMinStock
                    }
                },
                { new: true, runValidators: true }
            );

            if (!product) {
                return res.status(404).json({ message: 'Bu toptanciya ait urun bulunamadi.' });
            }

            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }
            res.json(sanitizeUser(user));
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    });

    router.get('/users/:userId/favorites', authorizeSelfParam('userId'), async (req, res) => {
        try {
            const user = await User.findById(req.params.userId).populate('favorites');
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            const favoriteProducts = await Product.find({ _id: { $in: user.favorites } });
            res.json(favoriteProducts);
        } catch (error) {
            res.status(500).json({ message: 'Favori urunler alinamadi.' });
        }
    });

    router.put('/users/:id/favorites/add', authorizeSelfParam('id'), async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.body.productId)) {
                return res.status(400).json({ message: 'Gecersiz urun ID.' });
            }

            const user = await User.findByIdAndUpdate(
                req.params.id,
                { $addToSet: { favorites: new mongoose.Types.ObjectId(req.body.productId) } },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            res.json(sanitizeUser(user));
        } catch (error) {
            res.status(500).json({ message: 'Favorilere urun eklenemedi.', error: error.message });
        }
    });

    router.put('/users/:id/favorites/remove', authorizeSelfParam('id'), async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.body.productId)) {
                return res.status(400).json({ message: 'Gecersiz urun ID.' });
            }

            const user = await User.findByIdAndUpdate(
                req.params.id,
                { $pull: { favorites: new mongoose.Types.ObjectId(req.body.productId) } },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            res.json(sanitizeUser(user));
        } catch (error) {
            res.status(500).json({ message: 'Favorilerden urun cikarilamadi.', error: error.message });
        }
    });

    router.get('/users/:userId/products', async (req, res) => {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            const isOwnProductList = req.auth?.userId === req.params.userId;
            if (!user.wholesaler && !isOwnProductList) {
                return res.status(403).json({ message: 'You are not authorized to access this product list.' });
            }

            const productDetails = await Product.find({
                _id: { $in: (user.products || []).map(item => item.productID) }
            });
            res.json(productDetails);
        } catch (error) {
            res.status(500).json({ message: 'Urunler alinamadi.', error });
        }
    });

    router.put('/users/:id/products', authorizeWholesalerParam('id'), async (req, res) => {
        const { productId, price, stockQuantity, minStockLevel } = req.body;

        try {
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({ message: 'Gecersiz urun ID.' });
            }

            const numericPrice = Number(price);
            const numericStock = Number(stockQuantity);
            const numericMinStock = Number(minStockLevel);
            if ([numericPrice, numericStock, numericMinStock].some(value => !Number.isFinite(value) || value < 0)) {
                return res.status(400).json({ message: 'Fiyat ve stok alanlari gecerli sayi olmalidir.' });
            }

            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            const productObjectId = new mongoose.Types.ObjectId(productId);
            const existingProduct = (user.products || []).find(
                item => item.productID?.toString() === productObjectId.toString()
            );

            if (existingProduct) {
                existingProduct.price = numericPrice;
                existingProduct.stockQuantity = numericStock;
                existingProduct.minStockLevel = numericMinStock;
            } else {
                user.products.push({
                    productID: productObjectId,
                    price: numericPrice,
                    stockQuantity: numericStock,
                    minStockLevel: numericMinStock
                });
            }

            const updatedUser = await user.save();
            res.json(sanitizeUser(updatedUser));
        } catch (error) {
            res.status(500).json({ message: 'Kullanici urunleri guncellenemedi.', error: error.message });
        }
    });

    router.get('/wholesalers/:id', async (req, res) => {
        try {
            const wholesaler = await User.findOne({ _id: req.params.id, wholesaler: true });
            if (!wholesaler) {
                return res.status(404).json({ message: 'Toptanci bulunamadi.' });
            }
            res.json({
                _id: wholesaler._id,
                name: wholesaler.name,
                email: wholesaler.email,
                taxNumber: wholesaler.taxNumber,
                address: wholesaler.address || 'Adres bilgisi girilmemis',
                phone: wholesaler.phone || 'Telefon bilgisi girilmemis'
            });
        } catch (error) {
            res.status(500).json({ message: 'Toptanci bilgileri alinamadi.', error: error.message });
        }
    });

    router.put('/users/:userId/profile', authorizeSelfParam('userId'), async (req, res) => {
        const { companyName, authorizedPerson, taxNumber, taxOffice, phone, address } = req.body;

        try {
            const user = await User.findById(req.params.userId);
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            if (companyName !== undefined) user.companyName = companyName;
            if (authorizedPerson !== undefined) user.authorizedPerson = authorizedPerson;
            if (taxNumber !== undefined) user.taxNumber = taxNumber;
            if (taxOffice !== undefined) user.taxOffice = taxOffice;
            if (phone !== undefined) user.phone = phone;
            if (address !== undefined) user.address = address;
            if (companyName) user.name = companyName;

            await user.save();
            res.json({ message: 'Profil basariyla guncellendi.', user: sanitizeUser(user) });
        } catch (error) {
            res.status(500).json({ message: 'Profil guncellenirken hata olustu.', error: error.message });
        }
    });

    router.put('/users/:userId/settings', authorizeSelfParam('userId'), async (req, res) => {
        const { notificationEmail, notificationLimitWarning, newPassword } = req.body;

        try {
            const user = await User.findById(req.params.userId);
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            if (notificationEmail !== undefined) user.notificationEmail = notificationEmail;
            if (notificationLimitWarning !== undefined) user.notificationLimitWarning = notificationLimitWarning;
            if (newPassword) user.password = hashPassword(newPassword);

            await user.save();
            res.json({ message: 'Ayarlar basariyla guncellendi.', user: sanitizeUser(user) });
        } catch (error) {
            res.status(500).json({ message: 'Ayarlar guncellenirken hata olustu.', error: error.message });
        }
    });

    return router;
};

module.exports = { createProfileRoutes };
