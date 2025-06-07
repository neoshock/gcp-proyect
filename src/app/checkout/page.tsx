'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Suspense } from 'react';
import { generateOrderNumber, createInvoiceWithParticipant } from '../services/invoiceService';
import { PaymentStatus } from '../types/invoices';

interface PurchaseData {
    amount: number;
    price: number;
    raffleId: string;
    expiresAt?: number;
}

interface TokenPayload {
    amount: number;
    price: number;
    raffleId: string;
    createdAt: number;
    exp: number; // JWT expiration timestamp
}

function CheckoutPageContent() {
    const params = useSearchParams();
    const token = params.get('token');

    const [isLoading, setIsLoading] = useState(true);
    const [orderNumber, setOrderNumber] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOfLegalAge, setIsOfLegalAge] = useState(false);
    const [tokenExpired, setTokenExpired] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null);

    // Función para decodificar JWT sin verificar (solo para obtener exp)
    const decodeJWTPayload = (token: string): TokenPayload | null => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return null;
        }
    };

    const generateNewOrderNumber = async () => {
        try {
            const number = await generateOrderNumber();
            setOrderNumber(number);
            return number;
        } catch (error) {
            console.error('Failed to generate order number:', error);
            const fallbackNumber = `ORD-${Math.floor(Math.random() * 10000)}`;
            setOrderNumber(fallbackNumber);
            return fallbackNumber;
        }
    };

    // Función para verificar si el token sigue siendo válido
    const checkTokenValidity = useCallback(async (): Promise<boolean> => {
        if (!token || tokenExpired) return false;

        // Verificar expiración del JWT localmente primero
        const payload = decodeJWTPayload(token);
        if (payload && payload.exp * 1000 <= Date.now()) {
            setTokenExpired(true);
            return false;
        }

        try {
            const response = await fetch('/api/validate-purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            if (response.status === 410 || response.status === 401) {
                setTokenExpired(true);
                return false;
            }

            return response.ok;
        } catch (error) {
            console.error('Error checking token validity:', error);
            return false;
        }
    }, [token, tokenExpired]);

    // Función para renovar el token
    const renewToken = async (): Promise<void> => {
        if (!purchaseData) return;

        try {
            setIsLoading(true);
            const response = await fetch('/api/create-purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: purchaseData.amount
                })
            });

            if (response.ok) {
                const { token: newToken } = await response.json();
                // Redirigir con el nuevo token
                window.location.href = `/checkout?token=${newToken}`;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'No se pudo renovar el token');
            }
        } catch (error) {
            console.error('Error renewing token:', error);
            alert('No se pudo renovar la sesión. Por favor, vuelve a intentar desde el inicio.');
            window.location.href = '/';
        } finally {
            setIsLoading(false);
        }
    };

    const validateAndSetPurchaseData = async (): Promise<any> => {
        if (!token) {
            throw new Error('Token de compra no encontrado');
        }

        // Verificar expiración localmente primero
        const payload = decodeJWTPayload(token);
        if (payload && payload.exp * 1000 <= Date.now()) {
            setTokenExpired(true);
            throw new Error('Tu sesión de compra ha expirado');
        }

        try {
            const response = await fetch('/api/validate-purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            // Verificar si la respuesta es JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                console.error('Response is not JSON:', responseText);
                throw new Error('El servidor no devolvió una respuesta JSON válida');
            }

            if (response.status === 410 || response.status === 401) {
                setTokenExpired(true);
                const errorData = await response.json();
                throw new Error(errorData.error || 'Tu sesión de compra ha expirado');
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error del servidor: ${response.status}`);
            }

            const validatedData = await response.json();

            // Validar que los datos requeridos estén presentes
            if (!validatedData.amount || !validatedData.price || !validatedData.raffleId) {
                throw new Error('Datos de validación incompletos');
            }

            const purchaseInfo: PurchaseData = {
                amount: validatedData.amount,
                price: validatedData.price,
                raffleId: validatedData.raffleId,
                expiresAt: payload?.exp ? payload.exp * 1000 : undefined
            };

            setPurchaseData(purchaseInfo);
            return validatedData;
        } catch (error) {
            console.error('Error validating token:', error);
            if (error instanceof Error && error.message.includes('expirado')) {
                setTokenExpired(true);
            }
            throw error;
        }
    };

    // Contador regresivo basado en JWT exp
    useEffect(() => {
        if (!token) return;

        const payload = decodeJWTPayload(token);
        if (!payload?.exp) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));

            if (remaining <= 0) {
                setTokenExpired(true);
                setTimeRemaining(0);
                clearInterval(interval);
            } else {
                setTimeRemaining(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [token]);

    // Verificación periódica del token
    useEffect(() => {
        if (tokenExpired) return;

        const interval = setInterval(async () => {
            const isValid = await checkTokenValidity();
            if (!isValid) {
                setTokenExpired(true);
            }
        }, 30000); // Verificar cada 30 segundos

        return () => clearInterval(interval);
    }, [checkTokenValidity, tokenExpired]);

    // Inicialización
    useEffect(() => {
        async function initializeCheckout() {
            try {
                if (!token) {
                    alert('Token de compra no encontrado. Por favor, regresa a la página anterior.');
                    return;
                }

                await generateNewOrderNumber();
                await validateAndSetPurchaseData();
            } catch (error: any) {
                console.error('Error initializing checkout:', error);
                alert(`Error al inicializar el checkout: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        }

        initializeCheckout();
    }, [token]);

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

    // Modificar las funciones de pago para verificar token antes de procesar
    const handleStripePayment = async (): Promise<void> => {
        if (!validateForm()) return;

        // Verificar token antes de procesar
        const isValid = await checkTokenValidity();
        if (!isValid) {
            setTokenExpired(true);
            alert('Tu sesión ha expirado. Por favor, renueva la sesión.');
            return;
        }

        if (!token || !purchaseData) {
            alert('Error: Token de compra no válido. Por favor, regresa a la página anterior.');
            return;
        }

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
                amount: purchaseData.amount,
                totalPrice: purchaseData.price
            });

            // Crear sesión de checkout de Stripe con el token
            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                body: JSON.stringify({
                    orderNumber,
                    amount: purchaseData.amount,
                    price: purchaseData.price,
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
                const result = await stripe?.redirectToCheckout({ sessionId: data.id });

                if (result?.error) {
                    console.error('Error en redirección de Stripe:', result.error);
                    throw new Error(result.error.message || 'Error en la redirección');
                }
            } else {
                throw new Error(data.error || 'No se pudo crear la sesión de Stripe');
            }

        } catch (error) {
            console.error('Error en el pago con Stripe:', error);
            alert('Hubo un error al procesar tu pago. Por favor, intenta de nuevo.');
            await generateNewOrderNumber();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTransferPayment = async (): Promise<void> => {
        if (!validateForm()) return;

        // Verificar token antes de procesar
        const isValid = await checkTokenValidity();
        if (!isValid) {
            setTokenExpired(true);
            alert('Tu sesión ha expirado. Por favor, renueva la sesión.');
            return;
        }

        if (!token || !purchaseData) {
            alert('Error: Token de compra no válido. Por favor, regresa a la página anterior.');
            return;
        }

        setIsProcessing(true);

        try {
            const tokenValidation = await fetch('/api/validate-purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            if (!tokenValidation.ok) {
                const errorData = await tokenValidation.json();
                throw new Error(errorData.error || 'Token inválido o expirado');
            }

            const validatedData = await tokenValidation.json();

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
                amount: validatedData.amount,
                totalPrice: validatedData.price
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            window.location.href = `/transfer-success?email=${formData.email}&name=${formData.name}&lastName=${formData.lastName}&phone=${formData.phone}&amount=${validatedData.amount}&price=${validatedData.price}&orderNumber=${orderNumber}`;
        } catch (error: any) {
            console.error('Error al crear factura para transferencia:', error);
            alert(`Hubo un error al procesar tu pedido: ${error.message}`);
            await generateNewOrderNumber();
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

    // Función para formatear el tiempo restante
    const formatTimeRemaining = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };


    // Componente de Loading
    const LoadingSpinner = () => (
        <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            <span>Procesando...</span>
        </div>
    );

    // Componente de advertencia de expiración
    const ExpirationWarning = () => {
        if (!timeRemaining || tokenExpired) return null;

        const isUrgent = timeRemaining <= 300; // 5 minutos o menos

        return (
            <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${isUrgent ? 'bg-red-100 border-red-500 text-red-800' : 'bg-yellow-100 border-yellow-500 text-yellow-800'
                } border`}>
                <div className="flex items-center space-x-2">
                    <span className="text-lg">⏰</span>
                    <div>
                        <p className="font-semibold">
                            {isUrgent ? '¡Tiempo limitado!' : 'Sesión activa'}
                        </p>
                        <p className="text-sm">
                            Tiempo restante: {formatTimeRemaining(timeRemaining)}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    // Componente de token expirado
    const TokenExpiredModal = () => {
        if (!tokenExpired) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4">
                    <div className="text-center">
                        <div className="text-red-600 text-6xl mb-4">⏰</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Sesión Expirada
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Tu sesión de compra ha expirado por seguridad.
                            Puedes renovar tu sesión o volver a empezar.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={renewToken}
                                disabled={isLoading}
                                className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition disabled:bg-gray-400"
                            >
                                {isLoading ? 'Renovando...' : 'Renovar Sesión'}
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 transition"
                            >
                                Volver al Inicio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Mostrar loading mientras se inicializa
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto mb-4"></div>
                    <p>Validando datos de compra...</p>
                </div>
            </div>
        );
    }

    // Si no hay datos de compra válidos, mostrar error
    if (!purchaseData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-8">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de validación</h2>
                    <p className="text-gray-600 mb-6">Los datos de compra no son válidos o han expirado.</p>
                    <button
                        onClick={() => window.history.back()}
                        className="bg-[#800000] text-white px-6 py-3 rounded-md hover:bg-[#600000] transition"
                    >
                        Regresar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <ExpirationWarning />
            <TokenExpiredModal />
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
                                    disabled={isProcessing}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Apellido *</label>
                                <input
                                    placeholder='Ej. Pérez'
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    disabled={isProcessing}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
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
                                disabled={isProcessing}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
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
                                disabled={isProcessing}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-1">Teléfono *</label>
                            <input
                                placeholder='Ej. 0991234567'
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={isProcessing}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
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
                                    disabled={isProcessing}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
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
                                disabled={isProcessing}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-1">Dirección *</label>
                            <input
                                placeholder='Ej. Av. Solano 1234'
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                disabled={isProcessing}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
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
                                        <p className="text-gray-500 text-sm">x {purchaseData.amount}</p>
                                    </div>
                                    <span>${purchaseData.price.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="py-4">
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>${purchaseData.price.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Mostrar número de orden */}
                            <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Número de pedido:</span> {orderNumber}
                                </p>
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
                                        disabled={isProcessing}
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
                                        disabled={isProcessing}
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
                                    disabled={isProcessing}
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
                                        disabled={isProcessing || !purchaseData}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-md font-semibold transition"
                                    >
                                        {isProcessing ? <LoadingSpinner /> : 'Pagar con tarjeta'}
                                    </button>
                                )}

                                {method === 'transfer' && (
                                    <button
                                        onClick={handleTransferPayment}
                                        disabled={isProcessing || !purchaseData}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-md font-semibold transition flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <LoadingSpinner />
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                                </svg>
                                                Contactar por WhatsApp
                                            </>
                                        )}
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