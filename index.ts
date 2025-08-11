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

const customers: Customer[] = Data;

function calculateAge(dob: string, referenceDate: string): number {
  const birthDate = new Date(dob);
  const referrenceDate = new Date(referenceDate);

  let age = referrenceDate.getFullYear() - birthDate.getFullYear();
  
  const hasNotHadBirthdayThisYear =
    referrenceDate.getMonth() < birthDate.getMonth() ||
    (referrenceDate.getMonth() === birthDate.getMonth() &&
      referrenceDate.getDate() < birthDate.getDate());

  if (hasNotHadBirthdayThisYear) {
    age--;
  }
  return age;
}

function calculateProductPaidAmount(product: Product, discount: string): number {
  const baseAmount = product.price * product.quantity;
  const taxAmount = product.taxAmt;

  const discountAmount = discount.endsWith("%")
    ? (parseFloat(discount) / 100) * baseAmount
    : parseFloat(discount);

  return baseAmount + taxAmount - discountAmount;
}
function calculateBillGrossTotal(products: Product[], discount: string): number {
  return products.reduce(
    (total, product) => total + calculateProductPaidAmount(product, discount),
    0
  );
}

function isBirthdayPurchase(billDate: string, dob: string): boolean {
  const bill = new Date(billDate);
  const birth = new Date(dob);
  const daysDiff = Math.abs(bill.getTime() - birth.getTime()) / (1000 * 3600 * 24);
  return daysDiff <= 30;
}

function getLastBillDate(bills: Bill[]): string {
  const latestTime = Math.max(...bills.map((bill) => new Date(bill.date).getTime()));
  return new Date(latestTime).toISOString();
}

function transformCustomer(customer: Customer): Customer {
  const updatedBills: Bill[] = customer.bills.map((bill) => {
    const productsWithPaidAmount = bill.products.map((product) => ({
      ...product,
      paidAmount: calculateProductPaidAmount(product, bill.discount),
    }));

    return {
      ...bill,
      products: productsWithPaidAmount,
      grossTotal: calculateBillGrossTotal(productsWithPaidAmount, bill.discount),
      payableAmt: productsWithPaidAmount.reduce(
        (sum, p) => sum + (p.paidAmount ?? 0),
        0
      ),
      boughtForBirthday: isBirthdayPurchase(bill.date, customer.dob),
    };
  });

  const ltv = updatedBills.reduce((sum, bill) => sum + (bill.payableAmt ?? 0), 0);
  const lastBillDate = getLastBillDate(updatedBills);

  return {
    ...customer,
    bills: updatedBills,
    age: calculateAge(customer.dob, lastBillDate),
    ltv,
    lastBillDate,
  };
}

const transformedCustomers = customers.map(transformCustomer);
fs.writeFileSync("outputJSON.json", JSON.stringify(transformedCustomers, null, 2), "utf8");
