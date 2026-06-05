"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, Truck, Check, AlertCircle, X } from "lucide-react";
import { CartItem } from "../types/woocommerce";
import { CheckoutData, BillingAddress, ShippingAddress } from "../types/checkout";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { formatPrice } from "../lib/format";

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onPlaceOrder: (checkoutData: CheckoutData) => Promise<any>;
  loading?: boolean;
}

// Campo de formulario editorial: label en versalitas, input con hairline
// inferior (no caja completa) — consistente con el buscador del Header.
function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  optional = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[var(--tw-ink-soft)]"
      >
        {label}
        {required && <span className="ml-0.5 text-[var(--tw-clay-deep)]">*</span>}
        {optional && <span className="ml-1 normal-case tracking-normal opacity-70">(opcional)</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1.5 w-full border-b border-[var(--tw-line)] bg-transparent py-2 text-[0.95rem] text-[var(--tw-ink)] outline-none transition-colors placeholder:text-[var(--tw-ink-soft)] focus:border-[var(--tw-clay-deep)]"
      />
    </div>
  );
}

export function Checkout({ isOpen, onClose, cartItems, onPlaceOrder, loading = false }: CheckoutProps) {
  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>(
    'shipping'
  );
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mercadopago');
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
    country: 'AR',
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
    country: 'AR',
  });

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  // Envío gratis a partir de cierto monto; debajo, costo fijo nacional.
  // Debe coincidir con la promesa de la landing (TRUST_SIGNALS).
  const FREE_SHIPPING_THRESHOLD = 50000;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 6500;
  // En Argentina el IVA va incluido en el precio mostrado, no se suma aparte.
  const total = subtotal + shipping;

  const paymentMethods = [
    {
      id: 'mercadopago',
      title: 'Mercado Pago',
      description: 'Tarjeta, débito o dinero en cuenta. Hasta 3 cuotas sin interés.',
      icon: CreditCard,
    },
    {
      id: 'bacs',
      title: 'Transferencia bancaria',
      description: 'Te pasamos los datos. Acreditación en el día.',
      icon: CreditCard,
    },
    {
      id: 'cod',
      title: 'Pago al recibir',
      description: 'Pagás cuando te llega el pedido.',
      icon: Truck,
    },
  ];

  // Cerrar con Escape y bloquear el scroll del body mientras está abierto.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

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
    const requiredBillingFields = ['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode', 'email', 'phone'];
    const missingBilling = requiredBillingFields.filter(field => !billingData[field as keyof BillingAddress]);

    if (missingBilling.length > 0) {
      setError('Completá tus datos para seguir con la compra.');
      return false;
    }

    if (!shippingSameAsBilling) {
      const requiredShippingFields = ['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode'];
      const missingShipping = requiredShippingFields.filter(field => !shippingData[field as keyof ShippingAddress]);

      if (missingShipping.length > 0) {
        setError('Completá la dirección de envío para continuar.');
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
      setError(err instanceof Error ? err.message : 'No pudimos procesar el pedido. Probá de nuevo.');
    }
  };

  const pillPrimary =
    "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--tw-ink)] px-6 py-3 text-[0.9rem] font-medium text-[var(--tw-paper)] transition-colors hover:bg-[var(--tw-clay-deep)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--tw-ink)]";
  const pillOutline =
    "inline-flex items-center justify-center gap-2 rounded-full border border-[var(--tw-line)] px-6 py-3 text-[0.9rem] font-medium text-[var(--tw-ink)] transition-colors hover:border-[var(--tw-ink)]";

  const renderShippingStep = () => (
    <div className="space-y-7">
      <div className="space-y-5">
        <h3 className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[var(--tw-ink-soft)]">
          Tus datos
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <Field id="billing_first_name" label="Nombre" required value={billingData.first_name} onChange={(v) => handleBillingChange('first_name', v)} />
          <Field id="billing_last_name" label="Apellido" required value={billingData.last_name} onChange={(v) => handleBillingChange('last_name', v)} />
        </div>

        <Field id="billing_company" label="Empresa" optional value={billingData.company ?? ''} onChange={(v) => handleBillingChange('company', v)} />
        <Field id="billing_address_1" label="Calle y número" required value={billingData.address_1} onChange={(v) => handleBillingChange('address_1', v)} />
        <Field id="billing_address_2" label="Piso / departamento" optional value={billingData.address_2 ?? ''} onChange={(v) => handleBillingChange('address_2', v)} />

        <div className="grid grid-cols-2 gap-4">
          <Field id="billing_city" label="Localidad" required value={billingData.city} onChange={(v) => handleBillingChange('city', v)} />
          <Field id="billing_state" label="Provincia" required value={billingData.state} onChange={(v) => handleBillingChange('state', v)} />
        </div>

        <Field id="billing_postcode" label="Código postal (CP)" required value={billingData.postcode} onChange={(v) => handleBillingChange('postcode', v)} />
        <Field id="billing_email" label="Email" type="email" required value={billingData.email} onChange={(v) => handleBillingChange('email', v)} />
        <Field id="billing_phone" label="Celular" type="tel" required value={billingData.phone} onChange={(v) => handleBillingChange('phone', v)} />
      </div>

      <div className="h-px w-full bg-[var(--tw-line)]" />

      <div className="space-y-5">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={shippingSameAsBilling}
            onChange={(e) => setShippingSameAsBilling(e.target.checked)}
            className="h-4 w-4 accent-[var(--tw-clay-deep)]"
          />
          <span className="text-[0.92rem] text-[var(--tw-ink)]">Enviar a esta misma dirección</span>
        </label>

        {!shippingSameAsBilling && (
          <div className="space-y-5">
            <h3 className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[var(--tw-ink-soft)]">
              Dirección de envío
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Field id="shipping_first_name" label="Nombre" required value={shippingData.first_name} onChange={(v) => handleShippingChange('first_name', v)} />
              <Field id="shipping_last_name" label="Apellido" required value={shippingData.last_name} onChange={(v) => handleShippingChange('last_name', v)} />
            </div>

            <Field id="shipping_address_1" label="Calle y número" required value={shippingData.address_1} onChange={(v) => handleShippingChange('address_1', v)} />
            <Field id="shipping_address_2" label="Piso / departamento" optional value={shippingData.address_2 ?? ''} onChange={(v) => handleShippingChange('address_2', v)} />

            <div className="grid grid-cols-2 gap-4">
              <Field id="shipping_city" label="Localidad" required value={shippingData.city} onChange={(v) => handleShippingChange('city', v)} />
              <Field id="shipping_state" label="Provincia" required value={shippingData.state} onChange={(v) => handleShippingChange('state', v)} />
            </div>

            <Field id="shipping_postcode" label="Código postal (CP)" required value={shippingData.postcode} onChange={(v) => handleShippingChange('postcode', v)} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" className={pillOutline} onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
          Volver a la bolsa
        </button>
        <button type="button" className={pillPrimary} onClick={() => setStep('payment')}>
          Continuar al pago
        </button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-7">
      <div className="space-y-4">
        <h3 className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[var(--tw-ink-soft)]">
          ¿Cómo querés pagar?
        </h3>

        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const IconComponent = method.icon;
            const active = selectedPaymentMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={`flex w-full items-center gap-3.5 rounded-[3px] border p-4 text-left transition-colors ${
                  active
                    ? 'border-[var(--tw-ink)] bg-[var(--tw-paper-deep)]'
                    : 'border-[var(--tw-line)] hover:border-[var(--tw-ink)]'
                }`}
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                    active ? 'border-[var(--tw-ink)]' : 'border-[var(--tw-line)]'
                  }`}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-[var(--tw-clay)]" />}
                </span>
                <IconComponent className="h-5 w-5 shrink-0 text-[var(--tw-ink-soft)]" strokeWidth={1.6} />
                <span>
                  <span className="block text-[0.95rem] font-medium text-[var(--tw-ink)]">
                    {method.title}
                  </span>
                  <span className="mt-0.5 block text-[0.83rem] text-[var(--tw-ink-soft)]">
                    {method.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap justify-between gap-3">
          <button type="button" className={pillOutline} onClick={() => setStep('shipping')}>
            <ArrowLeft className="h-4 w-4" />
            Volver a tus datos
          </button>
          <button type="button" className={pillPrimary} onClick={handlePlaceOrder} disabled={loading}>
            {loading ? 'Procesando…' : `Pagar ${formatPrice(total)}`}
          </button>
        </div>
        <p className="text-center text-[0.78rem] text-[var(--tw-ink-soft)]">
          Pago protegido. No guardamos los datos de tu tarjeta · Cambios y devoluciones sin cargo.
        </p>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-7 py-6 text-center">
      <div className="space-y-5">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--tw-clay)] text-[var(--tw-paper)]">
          <Check className="h-8 w-8" strokeWidth={2} />
        </div>

        <div>
          <h3 className="text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-[-0.02em]">
            ¡Listo! <span className="tw-display text-[var(--tw-clay-deep)]">Ya es tuyo.</span>
          </h3>
          <p className="mx-auto mt-3 max-w-[42ch] text-[0.95rem] leading-relaxed text-[var(--tw-ink-soft)]">
            Te mandamos un mail con el detalle. En cuanto despachamos el pedido,
            te llega el código de seguimiento para verlo hasta la puerta.
          </p>
        </div>

        {orderConfirmation && (
          <dl className="mx-auto max-w-[22rem] space-y-2 rounded-[3px] border border-[var(--tw-line)] bg-[var(--tw-paper-deep)] p-5 text-left text-[0.9rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--tw-ink-soft)]">N° de pedido</dt>
              <dd className="font-medium tabular-nums">#{orderConfirmation.number || orderConfirmation.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--tw-ink-soft)]">Total</dt>
              <dd className="font-medium tabular-nums">{formatPrice(total)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--tw-ink-soft)]">Estado</dt>
              <dd className="font-medium">{orderConfirmation.status}</dd>
            </div>
          </dl>
        )}
      </div>

      <button type="button" onClick={onClose} className={`${pillPrimary} w-full`}>
        Seguir comprando
      </button>
    </div>
  );

  const steps: { key: typeof step; label: string }[] = [
    { key: 'shipping', label: 'Datos' },
    { key: 'payment', label: 'Pago' },
    { key: 'confirmation', label: 'Listo' },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div
      className="tw-landing fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Finalizar compra"
    >
      <div
        className="tw-veil tw-veil-tint absolute inset-0"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div className="tw-panel-rise flex h-[90vh] max-h-[48rem] w-full max-w-4xl flex-col overflow-hidden rounded-[3px] bg-[var(--tw-paper)] text-[var(--tw-ink)] shadow-[0_40px_90px_-50px_oklch(0.22_0.015_50_/_0.5)]">
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {/* Formulario */}
            <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
              <div className="space-y-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-semibold tracking-[-0.02em]">
                    Finalizar compra
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="-mr-2 grid h-[44px] w-[44px] place-items-center rounded-full text-[var(--tw-ink-soft)] transition-colors hover:text-[var(--tw-ink)]"
                  >
                    <X className="h-[1.15rem] w-[1.15rem]" />
                  </button>
                </div>

                {/* Indicador de pasos */}
                <div className="flex items-center gap-3">
                  {steps.map((s, i) => {
                    const done = i < stepIndex;
                    const current = i === stepIndex;
                    return (
                      <div key={s.key} className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`grid h-7 w-7 place-items-center rounded-full text-[0.8rem] font-medium tabular-nums transition-colors ${
                              done
                                ? 'bg-[var(--tw-clay)] text-[var(--tw-paper)]'
                                : current
                                  ? 'bg-[var(--tw-ink)] text-[var(--tw-paper)]'
                                  : 'border border-[var(--tw-line)] text-[var(--tw-ink-soft)]'
                            }`}
                          >
                            {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                          </span>
                          <span
                            className={`text-[0.85rem] ${
                              current ? 'font-medium text-[var(--tw-ink)]' : 'text-[var(--tw-ink-soft)]'
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                        {i < steps.length - 1 && (
                          <span className="h-px w-6 bg-[var(--tw-line)]" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <div
                    className="flex items-start gap-2.5 rounded-[3px] border p-3.5 text-[0.88rem]"
                    style={{
                      borderColor: 'var(--destructive)',
                      color: 'var(--destructive)',
                      background: 'oklch(0.55 0.16 25 / 0.08)',
                    }}
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {step === 'shipping' && renderShippingStep()}
                {step === 'payment' && renderPaymentStep()}
                {step === 'confirmation' && renderConfirmationStep()}
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="w-full shrink-0 border-t border-[var(--tw-line)] bg-[var(--tw-paper-deep)] p-6 sm:p-8 lg:min-h-0 lg:w-96 lg:overflow-y-auto lg:border-l lg:border-t-0">
              <div className="space-y-5">
                <h3 className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[var(--tw-ink-soft)]">
                  Tu pedido
                </h3>

                <ul className="space-y-4">
                  {cartItems.map((item) => (
                    <li key={item.cartKey} className="flex gap-3">
                      <div className="tw-media relative h-16 w-12 shrink-0 overflow-clip rounded-[2px] bg-[var(--tw-paper)]">
                        <ImageWithFallback
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--tw-ink)] px-1 text-[0.65rem] font-semibold tabular-nums text-[var(--tw-paper)]">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[0.88rem] font-medium leading-snug">{item.product.name}</h4>
                        <p className="mt-0.5 text-[0.78rem] text-[var(--tw-ink-soft)]">
                          {item.selectedSize} · {item.selectedColor}
                        </p>
                        <p className="mt-0.5 text-[0.88rem] font-medium tabular-nums">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="h-px w-full bg-[var(--tw-line)]" />

                <div className="space-y-2.5 text-[0.9rem]">
                  <div className="flex justify-between">
                    <span className="text-[var(--tw-ink-soft)]">Subtotal</span>
                    <span className="tabular-nums">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--tw-ink-soft)]">Envío</span>
                    <span className="tabular-nums">
                      {shipping === 0 ? (
                        <span className="font-medium text-[var(--tw-clay-deep)]">Gratis</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>
                  <div className="h-px w-full bg-[var(--tw-line)]" />
                  <div className="flex items-baseline justify-between">
                    <span className="text-[0.95rem]">Total</span>
                    <span className="text-[1.35rem] font-semibold tabular-nums tracking-[-0.01em]">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <p className="text-[0.78rem] text-[var(--tw-ink-soft)]">IVA incluido.</p>

                  {shipping > 0 ? (
                    <div className="mt-2 rounded-[3px] border border-[var(--tw-line)] bg-[var(--tw-paper)] p-3">
                      <p className="text-[0.8rem] font-medium">
                        Te faltan{" "}
                        <span className="text-[var(--tw-clay-deep)]">
                          {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)}
                        </span>{" "}
                        para el envío gratis.
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--tw-line)]">
                        <div
                          className="h-full rounded-full bg-[var(--tw-clay)] transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 flex items-center gap-1.5 text-[0.8rem] font-medium text-[var(--tw-clay-deep)]">
                      <Check className="h-3.5 w-3.5" />
                      ¡Tenés envío gratis!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
