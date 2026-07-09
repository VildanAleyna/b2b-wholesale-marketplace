const express = require('express');
const mongoose = require('mongoose');
const { Product, User, Category, Model, Brand } = require('../models');
const { authenticateToken, requireWholesalerAdmin } = require('../utils/security');

const createCatalogRoutes = () => {
    const router = express.Router();
    const requireCatalogWriteAccess = [authenticateToken, requireWholesalerAdmin];
    const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
    const toNonNegativeNumber = (value) => {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
    };
    const toPositiveNumber = (value) => {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
    };

    router.get('/categories', async (req, res) => {
        try {
            const categories = await Category.find();
            res.json(categories);
        } catch (error) {
            res.status(500).json({ message: 'Kategoriler alinamadi.' });
        }
    });

    router.post('/categories', requireCatalogWriteAccess, async (req, res) => {
        try {
            const { name, image, modelIds } = req.body;
            const newCategory = new Category({ name, modelIds, image });
            await newCategory.save();
            res.status(201).json(newCategory);
        } catch (error) {
            res.status(500).json({ message: 'Kategori eklenemedi.' });
        }
    });

    router.get('/categories/:id', async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).json({ message: 'Kategori bulunamadi.' });
            }
            res.json(category);
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    });

    router.get('/models', async (req, res) => {
        try {
            const models = await Model.find();
            res.json(models);
        } catch (error) {
            res.status(500).json({ message: 'Modeller alinamadi.' });
        }
    });

    router.post('/models', requireCatalogWriteAccess, async (req, res) => {
        try {
            const { name, brandIds } = req.body;
            const newModel = new Model({ name, brandIds });
            await newModel.save();
            res.status(201).json(newModel);
        } catch (error) {
            res.status(500).json({ message: 'Model eklenemedi.' });
        }
    });

    router.get('/models/:id', async (req, res) => {
        try {
            const model = await Model.findById(req.params.id);
            if (!model) {
                return res.status(404).json({ message: 'Model bulunamadi.' });
            }
            res.json(model);
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    });

    router.get('/brands', async (req, res) => {
        try {
            const brands = await Brand.find();
            res.json(brands);
        } catch (error) {
            res.status(500).json({ message: 'Markalar alinamadi.' });
        }
    });

    router.post('/brands', requireCatalogWriteAccess, async (req, res) => {
        try {
            const { name, productIds } = req.body;
            const newBrand = new Brand({ name, productIds });
            await newBrand.save();
            res.status(201).json(newBrand);
        } catch (error) {
            res.status(500).json({ message: 'Marka eklenemedi.' });
        }
    });

    router.get('/brands/:id', async (req, res) => {
        try {
            const brand = await Brand.findById(req.params.id);
            if (!brand) {
                return res.status(404).json({ message: 'Marka bulunamadi.' });
            }
            res.json(brand);
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    });

    router.put('/brands/:id', requireCatalogWriteAccess, async (req, res) => {
        try {
            const updatedBrand = await Brand.findByIdAndUpdate(
                req.params.id,
                { $addToSet: { productIds: req.body.productId } },
                { new: true }
            );
            if (!updatedBrand) {
                return res.status(404).json({ message: 'Marka bulunamadi.' });
            }
            res.json(updatedBrand);
        } catch (error) {
            res.status(500).json({ message: 'Marka guncellenemedi.', error: error.message });
        }
    });

    router.get('/products', async (req, res) => {
        try {
            const page = Number(req.query.page);
            const limit = Number(req.query.limit);

            if (Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0) {
                const safeLimit = Math.min(limit, 100);
                const skip = (page - 1) * safeLimit;
                const [products, total] = await Promise.all([
                    Product.find().skip(skip).limit(safeLimit),
                    Product.countDocuments()
                ]);

                return res.json({
                    items: products,
                    total,
                    page,
                    limit: safeLimit,
                    totalPages: Math.ceil(total / safeLimit)
                });
            }

            const products = await Product.find();
            res.json(products);
        } catch (error) {
            res.status(500).json({ message: 'Urunler alinamadi.' });
        }
    });

    router.post('/products', requireCatalogWriteAccess, async (req, res) => {
        try {
            const { title, categoryId, modelId, brandId, image, wholesalers, minOrderQuantity } = req.body;

            if (!title || !categoryId || !modelId || !brandId || !image || !Array.isArray(wholesalers) || wholesalers.length === 0) {
                return res.status(400).json({ message: 'Eksik veri.' });
            }

            if (![categoryId, modelId, brandId].every(isValidObjectId)) {
                return res.status(400).json({ message: 'Gecersiz katalog ID.' });
            }

            const firstWholesaler = wholesalers[0];
            if (firstWholesaler?.usersID?.toString() !== req.auth.userId) {
                return res.status(403).json({ message: 'You can only create products for your own wholesaler account.' });
            }

            const price = toNonNegativeNumber(firstWholesaler.price);
            const stockQuantity = toNonNegativeNumber(firstWholesaler.stockQuantity);
            const minStockLevel = toNonNegativeNumber(firstWholesaler.minStockLevel);
            const normalizedMinOrderQuantity = minOrderQuantity === undefined ? 1 : toPositiveNumber(minOrderQuantity);

            if ([price, stockQuantity, minStockLevel, normalizedMinOrderQuantity].some(value => value === null)) {
                return res.status(400).json({ message: 'Fiyat, stok ve minimum siparis alanlari gecerli sayi olmalidir.' });
            }

            const newProduct = new Product({
                title,
                categoryId: new mongoose.Types.ObjectId(categoryId),
                modelId: new mongoose.Types.ObjectId(modelId),
                brandId: new mongoose.Types.ObjectId(brandId),
                image,
                minOrderQuantity: normalizedMinOrderQuantity || 1,
                wholesalers: [{
                    usersID: new mongoose.Types.ObjectId(req.auth.userId),
                    name: firstWholesaler.name,
                    price,
                    stockQuantity,
                    minStockLevel,
                    description: firstWholesaler.description
                }]
            });

            const result = await newProduct.save();
            await User.findByIdAndUpdate(req.auth.userId, {
                $addToSet: {
                    products: {
                        productID: result._id,
                        price,
                        stockQuantity,
                        minStockLevel
                    }
                }
            });
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Urun eklenemedi.', error: error.message });
        }
    });

    router.get('/products/:id', async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: 'Urun bulunamadi.' });
            }
            res.json(product);
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    });

    router.put('/products/:id', requireCatalogWriteAccess, async (req, res) => {
        try {
            const existingProduct = await Product.findById(req.params.id);
            if (!existingProduct) {
                return res.status(404).json({ message: 'Urun bulunamadi.' });
            }

            const existingWholesalerId = existingProduct.wholesalers?.[0]?.usersID?.toString();
            if (!existingWholesalerId || existingWholesalerId !== req.auth.userId) {
                return res.status(403).json({ message: 'You can only update products that belong to your wholesaler account.' });
            }

            const wholesalerUpdates = {};
            if (req.body.price !== undefined) {
                const price = toNonNegativeNumber(req.body.price);
                if (price === null) {
                    return res.status(400).json({ message: 'Fiyat gecerli bir sayi olmalidir.' });
                }
                wholesalerUpdates['wholesalers.0.price'] = price;
            }
            if (req.body.stockQuantity !== undefined) {
                const stockQuantity = toNonNegativeNumber(req.body.stockQuantity);
                if (stockQuantity === null) {
                    return res.status(400).json({ message: 'Stok gecerli bir sayi olmalidir.' });
                }
                wholesalerUpdates['wholesalers.0.stockQuantity'] = stockQuantity;
            }
            if (req.body.minStockLevel !== undefined) {
                const minStockLevel = toNonNegativeNumber(req.body.minStockLevel);
                if (minStockLevel === null) {
                    return res.status(400).json({ message: 'Minimum stok gecerli bir sayi olmalidir.' });
                }
                wholesalerUpdates['wholesalers.0.minStockLevel'] = minStockLevel;
            }

            if (Object.keys(wholesalerUpdates).length === 0) {
                return res.status(400).json({ message: 'Guncellenecek gecerli stok alani bulunamadi.' });
            }

            const product = await Product.findByIdAndUpdate(
                req.params.id,
                { $set: wholesalerUpdates },
                { new: true, runValidators: true }
            );

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
            res.json(product);
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    });

    router.delete('/products/:id', requireCatalogWriteAccess, async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: 'Urun bulunamadi.' });
            }
            const productWholesalerId = product.wholesalers?.[0]?.usersID?.toString();
            if (!productWholesalerId || productWholesalerId !== req.auth.userId) {
                return res.status(403).json({ message: 'You can only delete products that belong to your wholesaler account.' });
            }
            await Product.findByIdAndDelete(req.params.id);
            res.json({ message: 'Urun silindi.' });
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    });

    return router;
};

module.exports = { createCatalogRoutes };
