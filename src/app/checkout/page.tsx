'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Suspense } from 'react';
import { generateOrderNumber, createInvoiceWithParticipant } from '../services/invoiceService';
import { PaymentStatus } from '../types/invoices';

function CheckoutPageContent() {
    const params = useSearchParams();
    const amount = Number(params.get('amount')) || 10;
    const price = Number(params.get('price')) || 10;
    const [isLoading, setIsLoading] = useState(true);
    const [orderNumber, setOrderNumber] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOfLegalAge, setIsOfLegalAge] = useState(false);

    useEffect(() => {
        async function fetchOrderNumber() {
            try {
                const number = await generateOrderNumber();
                setOrderNumber(number);
            } catch (error) {
                console.error('Failed to generate order number:', error);
                setOrderNumber(`ORD-${Math.floor(Math.random() * 10000)}`);
            } finally {
                setIsLoading(false);
            }
        }

        fetchOrderNumber();
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        email: '',
        confirmEmail: '',
        phone: '',
        country: 'Ecuador',
        province: '',
        city: '',
        address: '',
    });

    const [method, setMethod] = useState<'stripe' | 'transfer' | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStripePayment = async () => {
        if (!validateForm()) return;

        setIsProcessing(true);

        try {
            // Crear la factura pendiente en la base de datos
            await createInvoiceWithParticipant({
                orderNumber: orderNumber,
                fullName: `${formData.name} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                country: formData.country,
                status: PaymentStatus.PENDING,
                paymentMethod: 'STRIPE',
                province: formData.province,
                city: formData.city,
                address: formData.address,
                amount: amount,
                totalPrice: price
            });

            // Crear sesión de checkout de Stripe
            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                body: JSON.stringify({
                    orderNumber,
                    amount,
                    price,
                    name: `${formData.name} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                    country: formData.country,
                    province: formData.province,
                    city: formData.city,
                    address: formData.address
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await res.json();

            if (data.id) {
                const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
                await stripe?.redirectToCheckout({ sessionId: data.id });
            } else {
                throw new Error('No se pudo crear la sesión de Stripe');
            }

        } catch (error) {
            console.error('Error en el pago con Stripe:', error);
            alert('Hubo un error al procesar tu pago. Por favor, intenta de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTransferPayment = async () => {
        if (!validateForm()) return;
        setIsProcessing(true);

        try {
            await createInvoiceWithParticipant({
                orderNumber: orderNumber,
                fullName: `${formData.name} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                country: formData.country,
                status: PaymentStatus.PENDING,
                paymentMethod: 'TRANSFER',
                province: formData.province,
                city: formData.city,
                address: formData.address,
                amount: amount,
                totalPrice: price
            });

            const timeout = setTimeout(() => {
                window.location.href = `/transfer-success?email=${formData.email}&name=${formData.name}&lastName=${formData.lastName}&phone=${formData.phone}&amount=${amount}&price=${price}&orderNumber=${orderNumber}`;
            }, 1000);
            return () => clearTimeout(timeout);
        } catch (error) {
            console.error('Error al crear factura para transferencia:', error);
            alert('Hubo un error al procesar tu pedido. Por favor, intenta de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    };

    const validateForm = () => {
        // Basic validation
        if (!formData.name || !formData.lastName || !formData.email || !formData.phone) {
            alert('Por favor completa todos los campos obligatorios (*)');
            return false;
        }

        if (formData.email !== formData.confirmEmail) {
            alert('Los correos electrónicos no coinciden');
            return false;
        }

        if (!isOfLegalAge) {
            alert('Debes confirmar que eres mayor de 18 años para continuar.');
            return false;
        }

        return true;
    };

    return (
        <>
            <header className="w-full bg-[#800000] py-4 text-center">
                <h1 className="text-white text-7xl font-extrabold tracking-wide">GPC</h1>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <p className="text-center text-gray-600">Cumpliendo sueños.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    {/* Columna izquierda: Datos de facturación (3 columnas) */}
                    <div className="md:col-span-3 bg-white p-6 rounded-md shadow space-y-4 border">
                        <h3 className="text-xl font-semibold mb-4">Datos Personales</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 mb-1">Nombre *</label>
                                <input
                                    placeholder='Ej. Juan'
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Apellido *</label>
                                <input
                                    placeholder='Ej. Pérez'
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-1">Email *</label>
                            <input
                                placeholder='Ej. correo@correo.com'
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-1">Confirmar Email *</label>
                            <input
                                placeholder='Ej. correo@correo.com'
                                name="confirmEmail"
                                type="email"
                                value={formData.confirmEmail}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-1">Teléfono *</label>
                            <input
                                placeholder='Ej. 0991234567'
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 mb-1">País *</label>
                                <input
                                    placeholder='Ej. Ecuador'
                                    name="country"
                                    value={formData.country}
                                    readOnly
                                    className="w-full px-4 py-2 border rounded-md bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Provincia *</label>
                                <select
                                    title='Seleccione...'
                                    name="province"
                                    value={formData.province}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Seleccione...</option>
                                    <option value="Azuay">Azuay</option>
                                    <option value="Bolívar">Bolívar</option>
                                    <option value="Cañar">Cañar</option>
                                    <option value="Carchi">Carchi</option>
                                    <option value="Chimborazo">Chimborazo</option>
                                    <option value="Cotopaxi">Cotopaxi</option>
                                    <option value="El Oro">El Oro</option>
                                    <option value="Esmeraldas">Esmeraldas</option>
                                    <option value="Galápagos">Galápagos</option>
                                    <option value="Guayas">Guayas</option>
                                    <option value="Imbabura">Imbabura</option>
                                    <option value="Loja">Loja</option>
                                    <option value="Los Ríos">Los Ríos</option>
                                    <option value="Manabí">Manabí</option>
                                    <option value="Morona Santiago">Morona Santiago</option>
                                    <option value="Napo">Napo</option>
                                    <option value="Orellana">Orellana</option>
                                    <option value="Pastaza">Pastaza</option>
                                    <option value="Pichincha">Pichincha</option>
                                    <option value="Santa Elena">Santa Elena</option>
                                    <option value="Santo Domingo">Santo Domingo</option>
                                    <option value="Sucumbíos">Sucumbíos</option>
                                    <option value="Tungurahua">Tungurahua</option>
                                    <option value="Zamora Chinchipe">Zamora Chinchipe</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-1">Ciudad *</label>
                            <input
                                placeholder='Ej. Cuenca'
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-1">Dirección *</label>
                            <input
                                placeholder='Ej. Av. Solano 1234'
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Columna derecha: Resumen y Métodos de pago (2 columnas) */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-white p-6 rounded-md shadow border">
                            <h3 className="text-xl font-semibold mb-4">Tu pedido</h3>

                            <div className="border-b pb-4">
                                <div className="flex justify-between font-semibold text-gray-600 mb-2">
                                    <span>Producto</span>
                                    <span>Subtotal</span>
                                </div>

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="font-medium">Números Mazda 6 Full - Yamaha MT03 2025 | Actividad #1</p>
                                        <p className="text-gray-500 text-sm">x {amount}</p>
                                    </div>
                                    <span>${(price).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="py-4">
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>${(price).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-md shadow border">
                            <h3 className="text-xl font-semibold mb-4">Selecciona tu método de pago</h3>

                            <div className="space-y-4">
                                <label className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="stripe"
                                        checked={method === 'stripe'}
                                        onChange={() => setMethod('stripe')}
                                        className="h-5 w-5 text-green-600"
                                    />
                                    <div>
                                        <span className="font-medium">Pagar con tarjeta</span>
                                        <p className="text-sm text-gray-500">Pago seguro con Stripe</p>
                                    </div>
                                </label>

                                <label className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="transfer"
                                        checked={method === 'transfer'}
                                        onChange={() => setMethod('transfer')}
                                        className="h-5 w-5 text-green-600"
                                    />
                                    <div>
                                        <span className="font-medium">Transferencia bancaria o depósito</span>
                                        <p className="text-sm text-gray-500">Transfiere a nuestra cuenta bancaria</p>
                                    </div>
                                </label>
                            </div>

                            <div className="mt-4 flex items-start space-x-2 mx-1">
                                <input
                                    id="legal-age"
                                    type="checkbox"
                                    checked={isOfLegalAge}
                                    onChange={(e) => setIsOfLegalAge(e.target.checked)}
                                    className="mt-1"
                                />
                                <label htmlFor="legal-age" className="text-sm text-gray-700">
                                    Confirmo que soy mayor de 18 años y acepto los términos de participación.
                                </label>
                            </div>


                            {method === 'transfer' && (
                                <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                                    <p className="font-medium mb-2">Detalles de transferencia:</p>
                                    <p className="mb-1"><span className="font-semibold">Banco:</span> Banco Pichincha</p>
                                    <p className="mb-1"><span className="font-semibold">Tipo de cuenta:</span> Cuenta de ahorro transaccional</p>
                                    <p className="mb-1"><span className="font-semibold">N° de cuenta:</span> 2207181692</p>
                                    <p className="mb-1"><span className="font-semibold">Titular:</span> Stiveen Sangoquiza Pazmiño</p>
                                    <p className="mb-1"><span className="font-semibold">RUC/CI:</span> 1720120771</p>

                                    <div className="mt-4 text-gray-700">
                                        <p className="font-semibold text-red-600">IMPORTANTE:</p>
                                        <p>NO PROCEDAS SI NO ESTÁS SEGURO de que quieres realizar la compra.</p>
                                        <p className="mt-2">Realiza tu pago directamente con transferencia o depósito a nuestra cuenta bancaria. Usa el número del pedido ({orderNumber}) como referencia de pago.</p>
                                        <p className="mt-2">Tu pedido no se procesará hasta que se haya recibido el importe en nuestra cuenta.</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6">
                                {method === 'stripe' && (
                                    <button
                                        onClick={handleStripePayment}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-semibold transition"
                                    >
                                        Pagar con tarjeta
                                    </button>
                                )}

                                {method === 'transfer' && (
                                    <button
                                        onClick={handleTransferPayment}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-semibold transition flex items-center justify-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                        Contactar por WhatsApp
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div>Cargando checkout...</div>}>
            <CheckoutPageContent />
        </Suspense>
    );
}