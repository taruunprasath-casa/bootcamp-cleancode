"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const data_json_1 = __importDefault(require("./data.json"));
const data = data_json_1.default;
function calculateAge(dateOfBirth, asOfDate) {
    const birthDate = new Date(dateOfBirth);
    const referenceDate = new Date(asOfDate);
    let age = referenceDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 ||
        (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
function calculatePaidAmount(product) {
    return product.price * product.quantity + product.taxAmt;
}
function calculateGrossTotalAmount(products) {
    return products.reduce((sum, p) => sum + calculatePaidAmount(p), 0);
}
function calculatePayableAmount(grossTotal, discount) {
    if (discount.endsWith("%")) {
        const percentage = parseFloat(discount) / 100;
        return grossTotal * (1 - percentage);
    }
    return grossTotal - parseFloat(discount);
}
function checkBoughtOnBirthday(bill, customer) {
    const billDate = new Date(bill.date);
    const dob = new Date(customer.dob);
    return (billDate.getMonth() === dob.getMonth() &&
        billDate.getDate() === dob.getDate());
}
function transformCustomerData(customer) {
    const transformedBills = customer.bills.map((bill) => {
        const updatedProducts = bill.products.map((product) => (Object.assign(Object.assign({}, product), { paidAmount: calculatePaidAmount(product) })));
        const grossTotalAmount = calculateGrossTotalAmount(updatedProducts);
        const payableAmount = calculatePayableAmount(grossTotalAmount, bill.discount);
        const boughtForBirthday = checkBoughtOnBirthday(bill, customer);
        return Object.assign(Object.assign({}, bill), { products: updatedProducts, grossTotal: grossTotalAmount, payableAmt: payableAmount, boughtForBirthday });
    });
    const ltv = transformedBills.reduce((sum, bill) => { var _a; return sum + ((_a = bill.payableAmt) !== null && _a !== void 0 ? _a : 0); }, 0);
    const lastBillDateCalculation = Math.max(...customer.bills.map((bill) => new Date(bill.date).getTime()));
    const lastBillDate = new Date(lastBillDateCalculation).toISOString();
    return Object.assign(Object.assign({}, customer), { bills: transformedBills, age: calculateAge(customer.dob, lastBillDate), ltv,
        lastBillDate });
}
const transformedData = data.map(transformCustomerData);
const jsonConversion = JSON.stringify(transformedData, null, 2);
fs.writeFileSync("outputJSON.json", jsonConversion, "utf8");
//# sourceMappingURL=index.js.map