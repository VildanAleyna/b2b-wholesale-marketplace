const sanitizeEmployee = (employee) => {
    const { password, ...safeEmployee } = employee.toObject ? employee.toObject() : employee;
    return safeEmployee;
};

const sanitizeUser = (user) => {
    if (!user) {
        return user;
    }

    const userObject = user.toObject ? user.toObject() : user;
    const { password, employee, ...safeUser } = userObject;

    if (Array.isArray(employee)) {
        safeUser.employee = employee.map(sanitizeEmployee);
    }

    return safeUser;
};

module.exports = { sanitizeEmployee, sanitizeUser };
