const express = require('express');
const { User } = require('../models');
const { sanitizeUser } = require('../utils/serializers');

const buildTokenPayload = (account, accountType, employee = null) => ({
    userId: account._id.toString(),
    accountType,
    wholesaler: Boolean(account.wholesaler),
    employeeId: employee?._id?.toString(),
    employeeRole: employee?.role || (employee?.admin ? 'admin' : undefined)
});

const createAuthRoutes = ({ hashPassword, comparePassword, createAuthToken }) => {
    const router = express.Router();

    const createAuthResponse = (account, accountType, employee = null) => ({
        user: account,
        token: createAuthToken(buildTokenPayload(account, accountType, employee)),
    });

    router.post('/register', async (req, res) => {
        const { name, email, password, taxNumber, wholesaler } = req.body;

        if (!name || !email || !password || !taxNumber || wholesaler === null || wholesaler === undefined) {
            return res.status(400).json({ message: 'Ad, e-posta, sifre, vergi numarasi ve kullanici tipi zorunludur.' });
        }

        const defaultEmployee = {
            name: 'admin',
            admin: true,
            password: hashPassword('admin'),
        };

        const userData = {
            name,
            email,
            password: hashPassword(password),
            taxNumber,
            wholesaler,
            ...(wholesaler ? { products: [], employee: [defaultEmployee] } : { favorites: [] }),
        };

        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({ message: 'Bu e-posta adresi zaten kayitli.' });
            }

            const newUser = await User.create(userData);
            const accountType = newUser.wholesaler ? 'wholesalerAdmin' : 'customer';
            const safeUser = {
                ...sanitizeUser(newUser),
                accountType,
            };

            res.status(201).json(createAuthResponse(safeUser, accountType));
        } catch (error) {
            res.status(500).json({ message: 'Kullanici kaydedilemedi.' });
        }
    });

    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        const identifier = (email || '').trim();

        if (!identifier || !password) {
            return res.status(400).json({ message: 'E-posta/kullanici adi ve sifre zorunludur.' });
        }

        try {
            const user = await User.findOne({ email: identifier });
            if (user && comparePassword(password, user.password)) {
                const accountType = user.wholesaler ? 'wholesalerAdmin' : 'customer';
                const safeUser = {
                    ...sanitizeUser(user),
                    accountType,
                };

                return res.json(createAuthResponse(safeUser, accountType));
            }

            const wholesalers = await User.find({ wholesaler: true, 'employee.name': identifier });
            const matchedWholesaler = wholesalers.find((wholesaler) => (
                (wholesaler.employee || []).some((employee) => (
                    employee.name === identifier && comparePassword(password, employee.password)
                ))
            ));

            if (!matchedWholesaler) {
                return res.status(401).json({ message: 'E-posta/kullanici adi veya sifre hatali.' });
            }

            const matchedEmployee = matchedWholesaler.employee.find((employee) => (
                employee.name === identifier && comparePassword(password, employee.password)
            ));

            const employeeUser = {
                _id: matchedWholesaler._id,
                employeeId: matchedEmployee._id,
                name: matchedEmployee.name,
                email: matchedWholesaler.email,
                companyName: matchedWholesaler.companyName,
                wholesalerName: matchedWholesaler.name,
                wholesaler: true,
                employeeAccount: true,
                employeeRole: matchedEmployee.role || (matchedEmployee.admin ? 'admin' : 'Depo Gorevlisi'),
                accountType: 'employee',
            };

            return res.json(createAuthResponse(employeeUser, 'employee', matchedEmployee));
        } catch (error) {
            return res.status(500).json({ message: 'Giris sirasinda sunucu hatasi olustu.' });
        }
    });

    return router;
};

module.exports = { createAuthRoutes };
