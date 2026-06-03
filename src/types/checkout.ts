// Checkout types
export interface BillingAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface CheckoutData {
  billing: BillingAddress;
  shipping?: ShippingAddress;
  payment_method: string;
  payment_method_title: string;
  customer_note?: string;
  shipping_same_as_billing: boolean;
}

export interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  total_tax: string;
  billing: BillingAddress;
  shipping: ShippingAddress;
  payment_method: string;
  payment_method_title: string;
  date_created: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    total: string;
  }>;
}
