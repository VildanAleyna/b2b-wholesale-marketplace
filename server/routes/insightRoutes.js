const express = require('express');
const { authenticateToken, authorizeSelfParam, authorizeWholesalerParam } = require('../utils/security');

const createInsightRoutes = ({ buildWholesalerInsights, buildCustomerInsights }) => {
    const router = express.Router();
    router.use(authenticateToken);

    router.get('/wholesalers/:id/insights', authorizeWholesalerParam('id'), async (req, res) => {
        try {
            const insights = await buildWholesalerInsights(req.params.id);
            res.json(insights);
        } catch (error) {
            res.status(500).json({ message: 'Operasyon analizleri alınamadı.' });
        }
    });

    router.get('/users/:id/insights', authorizeSelfParam('id'), async (req, res) => {
        try {
            const insights = await buildCustomerInsights(req.params.id);
            if (!insights) {
                return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
            }

            res.json(insights);
        } catch (error) {
            res.status(500).json({ message: 'Bayi analizleri alınamadı.' });
        }
    });

    return router;
};

module.exports = { createInsightRoutes };
