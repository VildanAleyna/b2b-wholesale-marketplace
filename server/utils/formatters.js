const formatCurrency = (amount) => `${Math.round(amount || 0).toLocaleString('tr-TR')} ₺`;

module.exports = { formatCurrency };
