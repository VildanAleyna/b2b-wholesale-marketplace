const express = require('express');
const { User } = require('../models');
const { sanitizeEmployee } = require('../utils/serializers');
const { authenticateToken } = require('../utils/security');

const createEmployeeRoutes = ({ hashPassword }) => {
    const router = express.Router();
    router.use(authenticateToken);

    router.get('/wholesalers/:wholesalerId/employees', async (req, res) => {
        try {
            const user = await User.findById(req.params.wholesalerId);
            if (!user) {
                return res.status(404).json({ message: 'Toptanci bulunamadi.' });
            }
            res.json({ employees: (user.employee || []).map(sanitizeEmployee) });
        } catch (error) {
            res.status(500).json({ message: 'Personel listesi getirilirken hata olustu.', error: error.message });
        }
    });

    router.post('/wholesalers/:wholesalerId/employees', async (req, res) => {
        const { name, role, password } = req.body;

        if (!name || !role || !password) {
            return res.status(400).json({ message: 'Isim, rol ve sifre zorunludur.' });
        }

        try {
            const user = await User.findById(req.params.wholesalerId);
            if (!user) {
                return res.status(404).json({ message: 'Toptanci bulunamadi.' });
            }

            user.employee = user.employee || [];

            const exists = user.employee.some(emp => emp.name.toLowerCase() === name.toLowerCase());
            if (exists) {
                return res.status(400).json({ message: 'Bu isimde bir personel zaten mevcut.' });
            }

            user.employee.push({
                name,
                role,
                password: hashPassword(password),
                createdAt: new Date()
            });
            await user.save();

            res.status(201).json({ message: 'Personel basariyla eklendi.', employees: user.employee.map(sanitizeEmployee) });
        } catch (error) {
            res.status(500).json({ message: 'Personel eklenirken hata olustu.', error: error.message });
        }
    });

    router.delete('/wholesalers/:wholesalerId/employees/:employeeName', async (req, res) => {
        const { wholesalerId, employeeName } = req.params;

        try {
            const user = await User.findById(wholesalerId);
            if (!user) {
                return res.status(404).json({ message: 'Toptanci bulunamadi.' });
            }

            user.employee = user.employee || [];
            const originalLength = user.employee.length;

            if (employeeName === 'admin') {
                return res.status(400).json({ message: 'Ana yonetici hesabi silinemez.' });
            }

            user.employee = user.employee.filter(emp => emp.name !== employeeName);

            if (user.employee.length === originalLength) {
                return res.status(404).json({ message: 'Personel bulunamadi.' });
            }

            await user.save();
            res.json({ message: 'Personel basariyla silindi.', employees: user.employee.map(sanitizeEmployee) });
        } catch (error) {
            res.status(500).json({ message: 'Personel silinirken hata olustu.', error: error.message });
        }
    });

    return router;
};

module.exports = { createEmployeeRoutes };
