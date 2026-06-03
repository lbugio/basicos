"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { Card } from "./ui/card";
import { ArrowLeft, CreditCard, Truck, Check, AlertCircle } from "lucide-react";
import { CartItem } from "../types/woocommerce";
import { CheckoutData, BillingAddress, ShippingAddress } from "../types/checkout";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onPlaceOrder: (checkoutData: CheckoutData) => Promise<any>;
  loading?: boolean;
}

export function Checkout({ isOpen, onClose, cartItems, onPlaceOrder, loading = false }: CheckoutProps) {
  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>(
    'shipping'
  );
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod');
  const [error, setError] = useState<string | null>(null);
  const [orderConfirmation, setOrderConfirmation] = useState<any>(null);

  const [billingData, setBillingData] = useState<BillingAddress>({
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'ES',
    email: '',
    phone: '',
  });

  const [shippingData, setShippingData] = useState<ShippingAddress>({
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'ES',
  });

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = 5.99; // Fixed shipping cost
  const tax = subtotal * 0.21; // 21% IVA
  const total = subtotal + shipping + tax;

  const paymentMethods = [
    {
      id: 'cod',
      title: 'Pago Contra Reembolso',
      description: 'Paga cuando recibas tu pedido',
      icon: Truck,
    },
    {
      id: 'bacs',
      title: 'Transferencia Bancaria',
      description: 'Transfiere directamente a nuestra cuenta bancaria',
      icon: CreditCard,
    },
  ];

  if (!isOpen) return null;

  const handleBillingChange = (field: keyof BillingAddress, value: string) => {
    setBillingData(prev => ({ ...prev, [field]: value }));
    
    if (shippingSameAsBilling && field !== 'email' && field !== 'phone') {
      setShippingData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleShippingChange = (field: keyof ShippingAddress, value: string) => {
    setShippingData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredBillingFields = ['first_name', 'last_name', 'address_1', 'city', 'postcode', 'email'];
    const missingBilling = requiredBillingFields.filter(field => !billingData[field as keyof BillingAddress]);
    
    if (missingBilling.length > 0) {
      setError(`Por favor completa los siguientes campos de facturación: ${missingBilling.join(', ')}`);
      return false;
    }

    if (!shippingSameAsBilling) {
      const requiredShippingFields = ['first_name', 'last_name', 'address_1', 'city', 'postcode'];
      const missingShipping = requiredShippingFields.filter(field => !shippingData[field as keyof ShippingAddress]);
      
      if (missingShipping.length > 0) {
        setError(`Por favor completa los siguientes campos de envío: ${missingShipping.join(', ')}`);
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    const checkoutData: CheckoutData = {
      billing: billingData,
      shipping: shippingSameAsBilling ? {
        first_name: billingData.first_name,
        last_name: billingData.last_name,
        company: billingData.company,
        address_1: billingData.address_1,
        address_2: billingData.address_2,
        city: billingData.city,
        state: billingData.state,
        postcode: billingData.postcode,
        country: billingData.country,
      } : shippingData,
      payment_method: selectedPaymentMethod,
      payment_method_title: paymentMethods.find(p => p.id === selectedPaymentMethod)?.title || '',
      shipping_same_as_billing: shippingSameAsBilling,
    };

    try {
      const order = await onPlaceOrder(checkoutData);
      setOrderConfirmation(order);
      setStep('confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pedido');
    }
  };

  const renderShippingStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Información de Facturación</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="billing_first_name">Nombre *</Label>
            <Input
              id="billing_first_name"
              value={billingData.first_name}
              onChange={(e) => handleBillingChange('first_name', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="billing_last_name">Apellidos *</Label>
            <Input
              id="billing_last_name"
              value={billingData.last_name}
              onChange={(e) => handleBillingChange('last_name', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="billing_company">Empresa (opcional)</Label>
          <Input
            id="billing_company"
            value={billingData.company}
            onChange={(e) => handleBillingChange('company', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="billing_address_1">Dirección *</Label>
          <Input
            id="billing_address_1"
            value={billingData.address_1}
            onChange={(e) => handleBillingChange('address_1', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="billing_address_2">Dirección 2 (opcional)</Label>
          <Input
            id="billing_address_2"
            value={billingData.address_2}
            onChange={(e) => handleBillingChange('address_2', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="billing_city">Ciudad *</Label>
            <Input
              id="billing_city"
              value={billingData.city}
              onChange={(e) => handleBillingChange('city', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="billing_postcode">Código Postal *</Label>
            <Input
              id="billing_postcode"
              value={billingData.postcode}
              onChange={(e) => handleBillingChange('postcode', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="billing_email">Email *</Label>
          <Input
            id="billing_email"
            type="email"
            value={billingData.email}
            onChange={(e) => handleBillingChange('email', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="billing_phone">Teléfono *</Label>
          <Input
            id="billing_phone"
            type="tel"
            value={billingData.phone}
            onChange={(e) => handleBillingChange('phone', e.target.value)}
            required
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="same_address"
            checked={shippingSameAsBilling}
            onChange={(e) => setShippingSameAsBilling(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="same_address">La dirección de envío es igual a la de facturación</Label>
        </div>

        {!shippingSameAsBilling && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información de Envío</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipping_first_name">Nombre *</Label>
                <Input
                  id="shipping_first_name"
                  value={shippingData.first_name}
                  onChange={(e) => handleShippingChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="shipping_last_name">Apellidos *</Label>
                <Input
                  id="shipping_last_name"
                  value={shippingData.last_name}
                  onChange={(e) => handleShippingChange('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="shipping_address_1">Dirección *</Label>
              <Input
                id="shipping_address_1"
                value={shippingData.address_1}
                onChange={(e) => handleShippingChange('address_1', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="shipping_address_2">Dirección 2 (opcional)</Label>
              <Input
                id="shipping_address_2"
                value={shippingData.address_2}
                onChange={(e) => handleShippingChange('address_2', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipping_city">Ciudad *</Label>
                <Input
                  id="shipping_city"
                  value={shippingData.city}
                  onChange={(e) => handleShippingChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="shipping_postcode">Código Postal *</Label>
                <Input
                  id="shipping_postcode"
                  value={shippingData.postcode}
                  onChange={(e) => handleShippingChange('postcode', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Carrito
        </Button>
        <Button onClick={() => setStep('payment')}>
          Continuar al Pago
        </Button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Método de Pago</h3>
        
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <Card
                key={method.id}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedPaymentMethod === method.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedPaymentMethod(method.id)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={method.id}
                    checked={selectedPaymentMethod === method.id}
                    onChange={() => setSelectedPaymentMethod(method.id)}
                    className="text-primary"
                  />
                  <IconComponent className="h-5 w-5" />
                  <div>
                    <Label htmlFor={method.id} className="font-medium cursor-pointer">
                      {method.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('shipping')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Envío
        </Button>
        <Button onClick={handlePlaceOrder} disabled={loading}>
          {loading ? 'Procesando...' : 'Realizar Pedido'}
        </Button>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-green-600">¡Pedido Confirmado!</h3>
          <p className="text-muted-foreground mt-2">
            Tu pedido ha sido procesado correctamente
          </p>
        </div>

        {orderConfirmation && (
          <div className="bg-muted p-4 rounded-lg">
            <p><strong>Número de Pedido:</strong> #{orderConfirmation.number || orderConfirmation.id}</p>
            <p><strong>Total:</strong> €{total.toFixed(2)}</p>
            <p><strong>Estado:</strong> {orderConfirmation.status}</p>
          </div>
        )}
      </div>

      <Button onClick={onClose} className="w-full">
        Continuar Comprando
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex h-full">
          {/* Left Side - Form */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Checkout</h2>
                <Button variant="ghost" onClick={onClose}>
                  ✕
                </Button>
              </div>

              {/* Steps indicator */}
              <div className="flex space-x-4">
                <div className={`flex items-center space-x-2 ${step === 'shipping' ? 'text-primary' : step === 'payment' || step === 'confirmation' ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'shipping' ? 'bg-primary text-white' : step === 'payment' || step === 'confirmation' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                    1
                  </div>
                  <span>Envío</span>
                </div>
                <div className={`flex items-center space-x-2 ${step === 'payment' ? 'text-primary' : step === 'confirmation' ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-primary text-white' : step === 'confirmation' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                    2
                  </div>
                  <span>Pago</span>
                </div>
                <div className={`flex items-center space-x-2 ${step === 'confirmation' ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirmation' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                    3
                  </div>
                  <span>Confirmación</span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {step === 'shipping' && renderShippingStep()}
              {step === 'payment' && renderPaymentStep()}
              {step === 'confirmation' && renderConfirmationStep()}
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="w-96 bg-muted p-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resumen del Pedido</h3>
              
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.cartKey} className="flex space-x-3">
                    <div className="relative">
                      <ImageWithFallback
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.selectedSize} • {item.selectedColor}
                      </p>
                      <p className="font-medium">€{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>€{shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (21%)</span>
                  <span>€{tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
