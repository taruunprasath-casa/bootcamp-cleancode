import * as fs from "fs";
import Data from "./data.json";

type Product = {
  skuCode: string;
  price: number;
  quantity: number;
  taxAmt: number;
  paidAmount?: number;
};

type Bill = {
  date: string;
  products: Product[];
  discount: string;
  boughtForBirthday?: boolean;
  grossTotal?: number;
  payableAmt?: number;
};

type Customer = {
  name: string;
  dob: string;
  bills: Bill[];
  age?: number;
  ltv?: number;
  lastBillDate?: string;
};

const MS_IN_A_DAY = 1000 * 60 * 60 * 24;
const BIRTHDAY_PURCHASE_DAYS = 30;

const customers: Customer[] = Data;


function calculateAge(dob: string, referenceDate: string): number {
  const birthDate = new Date(dob);
  const refDate = new Date(referenceDate);

  let age = refDate.getFullYear() - birthDate.getFullYear();
  const birthdayNotYetOccurred =
    refDate.getMonth() < birthDate.getMonth() ||
    (refDate.getMonth() === birthDate.getMonth() &&
      refDate.getDate() < birthDate.getDate());

  return birthdayNotYetOccurred ? age - 1 : age;
}

function calculateDiscountAmount(discount: string, baseAmount: number): number {
  if (discount.endsWith("%")) {
    return (parseFloat(discount) / 100) * baseAmount;
  }
  return parseFloat(discount);
}

function calculateProductPaidAmount(product: Product, discount: string): number {
  const baseAmount = product.price * product.quantity;
  const discountAmount = calculateDiscountAmount(discount, baseAmount);
  return baseAmount + product.taxAmt - discountAmount;
}

function calculateBillTotals(products: Product[], discount: string): {
  grossTotal: number;
  payableAmt: number;
} {
  const productsWithPaidAmount = products.map((product) => ({
    ...product,
    paidAmount: calculateProductPaidAmount(product, discount),
  }));

  const payableAmt = productsWithPaidAmount.reduce(
    (sum, p) => sum + (p.paidAmount ?? 0),
    0
  );

  return {
    grossTotal: payableAmt, 
    payableAmt,
  };
}

function isBirthdayPurchase(billDate: string, dob: string): boolean {
  const billTime = new Date(billDate).getTime();
  const birthDayThisYear = new Date(billDate);
  birthDayThisYear.setMonth(new Date(dob).getMonth());
  birthDayThisYear.setDate(new Date(dob).getDate());

  const daysDiff = Math.abs(billTime - birthDayThisYear.getTime()) / MS_IN_A_DAY;
  return daysDiff <= BIRTHDAY_PURCHASE_DAYS;
}

function getLastBillDate(bills: Bill[]): string {
  const latestTimestamp = Math.max(
    ...bills.map((bill) => new Date(bill.date).getTime())
  );
  return new Date(latestTimestamp).toISOString();
}

function transformBill(bill: Bill, customerDob: string): Bill {
  const { grossTotal, payableAmt } = calculateBillTotals(
    bill.products,
    bill.discount
  );

  const productsWithPaidAmount = bill.products.map((product) => ({
    ...product,
    paidAmount: calculateProductPaidAmount(product, bill.discount),
  }));

  return {
    ...bill,
    products: productsWithPaidAmount,
    grossTotal,
    payableAmt,
    boughtForBirthday: isBirthdayPurchase(bill.date, customerDob),
  };
}

function transformCustomer(customer: Customer): Customer {
  const updatedBills = customer.bills.map((bill) =>
    transformBill(bill, customer.dob)
  );

  const totalValue = updatedBills.reduce(
    (sum, bill) => sum + (bill.payableAmt ?? 0),
    0
  );
  const lastBillDate = getLastBillDate(updatedBills);

  return {
    ...customer,
    bills: updatedBills,
    age: calculateAge(customer.dob, lastBillDate),
    ltv: totalValue,
    lastBillDate,
  };
}

const transformedCustomers = customers.map(transformCustomer);

fs.writeFileSync(
  "outputJSON.json",
  JSON.stringify(transformedCustomers, null, 2),
  "utf8"
);

