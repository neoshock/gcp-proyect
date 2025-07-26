'use client';
import Image from "next/image";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from "react";

// Importamos nuestros servicios y tipos
import { getBlessedNumbers, getSoldTicketsCount, getUserTickets } from "./services/numberService";
import { BlessedNumber, TicketOption, TicketPurchase } from "./types/tickets";
import { BlessedNumbersSection } from "./components/BlessedNumbersSection";
import { VideoModal } from './components/VideoModal';
import { TicketSearchModal } from "./components/TicketSearchModal";
import { getActiveRaffle } from "./services/raffleService";
import { Raffle } from "./types/raffles";
import ImageCarousel from "./components/ImageCarousel";
import { createPurchaseToken } from "./services/purchaseTokenService";
import { YouTubeVideoPlayer } from "./components/YouTubeVideoPlayer";

const MARKETING_BOOST_PERCENTAGE = 3;

function TicketCardWithToken({ option, bestSeller = false, limitedOffer = false, isSoldOut = false }: { option: TicketOption, bestSeller?: boolean, limitedOffer?: boolean, isSoldOut?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (typeof ref === 'string' && ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  const handleClick = async () => {
    if (isSoldOut) return;

    try {
      setLoading(true);

      // Crear token seguro en el backend
      const token = await createPurchaseToken(option.amount);

      // Redirigir incluyendo el ref si existe
      const checkoutUrl = referralCode
        ? `/checkout?token=${token}&ref=${encodeURIComponent(referralCode)}`
        : `/checkout?token=${token}`;

      router.push(checkoutUrl);
    } catch (error) {
      alert('Error al procesar la compra. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative bg-gray-100 border rounded-2xl p-3 shadow hover:shadow-lg transition text-center flex flex-col items-center ${limitedOffer ? 'border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50' : ''
        } ${isSoldOut ? 'opacity-50 bg-gray-200 cursor-not-allowed' : 'cursor-pointer'
        } ${loading ? 'opacity-50 pointer-events-none' : ''
        }`}
      onClick={!isSoldOut ? handleClick : undefined}
    >
      {/* Overlay para sold out */}
      {isSoldOut && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-2xl flex items-center justify-center z-20">
          <div className="bg-red-600 text-white text-lg font-bold px-4 py-2 rounded-lg shadow-lg transform rotate-12">
            AGOTADO
          </div>
        </div>
      )}

      {/* Cinta "Más vendido" */}
      {bestSeller && !isSoldOut && (
        <div className="absolute -top-3 -left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-tr-lg rounded-bl-lg shadow-md z-10">
          MÁS VENDIDO
        </div>
      )}

      {/* Cinta "Oferta Limitada" */}
      {limitedOffer && !isSoldOut && (
        <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-tl-lg rounded-br-lg shadow-md z-10 animate-pulse">
          OFERTA LIMITADA
        </div>
      )}

      <h3 className={`text-xl font-bold tracking-wide mb-2 ${limitedOffer ? 'text-orange-700' : ''}`}>
        x{option.amount} NÚMEROS
      </h3>

      {limitedOffer && !isSoldOut && (
        <div className="mb-2">
          <div className="text-xs text-orange-600 font-semibold">¡SÚPER DESCUENTO!</div>
        </div>
      )}

      <p className={`text-2xl font-bold mb-4 ${limitedOffer ? 'text-orange-600' : ''}`}>
        ${option.price}
      </p>

      <button
        className={`text-sm font-semibold px-4 py-2 rounded transition ${isSoldOut
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : limitedOffer
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-black text-white hover:bg-gray-800'
          } ${loading ? 'cursor-not-allowed' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!isSoldOut) handleClick();
        }}
        disabled={loading || isSoldOut}
      >
        {isSoldOut ? 'AGOTADO' : loading ? 'PROCESANDO...' : 'COMPRAR'}
      </button>
    </div>
  );
}

export default function HomeContent() {
  const [soldTickets, setSoldTickets] = useState(350);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [blessedNumbers, setBlessedNumbers] = useState<BlessedNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Estados para la consulta de tickets
  const [searchEmail, setSearchEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketPurchases, setTicketPurchases] = useState<TicketPurchase[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Definimos los valores base para los tickets
  const imageUrls = [
    "/images/1.png",
    "/images/2.png",
    "/images/3.png",
    "/images/4.png",
    "/images/5.png",
    "/images/6.png",
  ];

  const baseAmounts = [20, 30, 40, 50, 75, 100];

  const ticketOptions: TicketOption[] = raffle
    ? baseAmounts.map((amount) => ({
      amount,
      price: amount * raffle.price,
    }))
    : [];

  const limitedOfferOption: TicketOption = {
    amount: 10,
    price: 5
  };

  // Verificar si está sold out
  const isSoldOut = true;
  const remainingTickets = raffle ? raffle.total_numbers - soldTickets : 0;

  const soldPercentage = raffle && raffle.total_numbers > 0
    ? Math.min(((soldTickets / raffle.total_numbers) * 100) + MARKETING_BOOST_PERCENTAGE, 100)
    : 0;

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (typeof ref === 'string' && ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && soldPercentage > 0) {
      const startValue = animatedPercentage;
      const endValue = soldPercentage;
      const duration = 1500;
      const startTime = Date.now();

      const animateProgressBar = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed < duration) {
          const progress = elapsed / duration;
          const easedProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2; // easeInOutQuad

          const newValue = startValue + (endValue - startValue) * easedProgress;
          setAnimatedPercentage(newValue);
          requestAnimationFrame(animateProgressBar);
        } else {
          setAnimatedPercentage(endValue);
        }
      };

      requestAnimationFrame(animateProgressBar);
    }
  }, [loading, soldPercentage]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const raffle = await getActiveRaffle();
        const blessedData = await getBlessedNumbers(raffle.id);
        const soldCount = await getSoldTicketsCount(raffle.id);

        setBlessedNumbers(blessedData);
        setSoldTickets(soldCount);
        setRaffle(raffle);

      } catch (err: any) {
        console.error("Error cargando datos:", err);
        setError("No se pudieron cargar los datos. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Función para actualizar un número bendecido cuando es reclamado
  const handleNumberClaimed = (updatedNumber: BlessedNumber) => {
    setBlessedNumbers(prevNumbers =>
      prevNumbers.map(number =>
        number.id === updatedNumber.id ? updatedNumber : number
      )
    );
  };

  const handleCustomBuyWithToken = async () => {
    if (isSoldOut) {
      alert("Lo sentimos, todos los boletos han sido vendidos");
      return;
    }

    if (!customAmount || customAmount <= 0 || customAmount < 20) {
      alert("Por favor ingresa una cantidad válida");
      return;
    }

    if (customAmount > 10000) {
      alert("La cantidad máxima a comprar es de 10,000 números");
      return;
    }

    if (customAmount > remainingTickets) {
      alert(`Solo quedan ${remainingTickets} boletos disponibles`);
      return;
    }

    try {
      // Crear token seguro
      const token = await createPurchaseToken(customAmount);

      const checkoutUrl = referralCode
        ? `/checkout?token=${token}&ref=${encodeURIComponent(referralCode)}`
        : `/checkout?token=${token}`;

      router.push(checkoutUrl);
    } catch (error) {
      alert('Error al procesar la compra. Intenta nuevamente.');
    }
  };

  // Función para buscar tickets por correo
  const handleSearchTickets = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!searchEmail || !searchEmail.includes('@')) {
      setSearchError("Por favor, ingresa un correo electrónico válido");
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);

      const tickets = await getUserTickets(searchEmail);
      setTicketPurchases(tickets);
      setIsModalOpen(true);

    } catch (err: any) {
      console.error("Error al buscar tickets:", err);
      setSearchError(err.message || "No se pudieron encontrar tus números. Intenta nuevamente.");
    } finally {
      setSearchLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Header */}
      <header className="w-full bg-[#800000] text-center">
        <Image
          src="/images/logo-secondary.png"
          alt="Logo"
          width={1200}
          height={300}
          className="mx-auto mb-2"
        />
      </header>
      <main className="flex flex-col items-center p-4 max-w-4xl mx-auto">

        {/* Banner de sold out */}
        {isSoldOut && (
          <section className="w-full mb-6">
            <div className="bg-red-600 text-white text-center py-4 px-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-2">🎉 ¡SOLD OUT! 🎉</h2>
              <p className="text-lg">Todos los boletos han sido vendidos</p>
              <p className="text-sm mt-2">¡Gracias por participar! El sorteo se realizará pronto.</p>
            </div>
          </section>
        )}

        {/* Título destacado */}
        <section className="text-center mb-4">
          <h2 className="text-2xl sm:text-4xl font-bold leading-tight">
            {`Gana un Mazda 6 Full`}
          </h2>
          <p className="text-2xl sm:text-4xl font-semibold">
            <strong>Yamaha MT 03, 2025 0KM</strong>
          </p>
          <p className="text-2xl sm:text-4xl font-semibold">
            <strong>+ De $3,000 Mil Dólares en Premios</strong>
          </p>
        </section>

        {/* Imagen del premio */}
        <div className="w-full mb-6">
          <div className="w-full ">
            <ImageCarousel images={imageUrls} />
          </div>
        </div>

        {/* Descripción */}
        <section className="text-center mb-6">
          {!isSoldOut ? (
            <p>Participa comprando uno o más boletos. <strong>¡Mientras más compres, más chances tienes!</strong></p>
          ) : (
            <p>¡Gracias a todos los participantes! <strong>El sorteo se realizará próximamente.</strong></p>
          )}
        </section>

        {/* Barra de progreso */}
        <section className="w-full mb-5">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
            <div>Progreso de la venta</div>
            <div>{Math.round(soldPercentage)}%</div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden shadow-inner">
            <div
              className={`h-full text-sm text-white font-medium flex items-center justify-center transition-all duration-500 ease-out ${isSoldOut
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-green-400 to-green-600'
                }`}
              style={{
                width: `${Math.max(animatedPercentage, 0.5)}%`,
                boxShadow: isSoldOut
                  ? '0 2px 4px rgba(220, 38, 38, 0.3)'
                  : '0 2px 4px rgba(0, 150, 0, 0.3)'
              }}
            >
              {isSoldOut && animatedPercentage >= 90 && (
                <span className="text-xs font-bold">¡SOLD OUT!</span>
              )}
            </div>
          </div>
          <div className="text-xs mt-1">
            {!isSoldOut ? (
              <p className="mb-4 text-center ">
                Cuando la barra llegue al 100% daremos por finalizado y procederemos a realizar el sorteo entre todos los participantes.
                Se tomarán los 5 números de la primera y segunda suerte del programa <strong>LOTERIA NACIONAL</strong>.
              </p>
            ) : (
              <p className="mb-4 text-center font-semibold text-red-600">
                ¡Venta finalizada! Se procederá a realizar el sorteo entre todos los participantes.
                Se tomarán los 5 números de la primera y segunda suerte del programa <strong>LOTERIA NACIONAL</strong>.
              </p>
            )}
          </div>

          {/* Información de tickets restantes */}
          {!isSoldOut && remainingTickets <= 100 && remainingTickets > 0 && (
            <div className="text-center mt-2">
              <span className="bg-orange-100 text-orange-800 text-sm font-semibold px-3 py-1 rounded-full">
                ⚡ ¡Solo quedan {remainingTickets} boletos disponibles!
              </span>
            </div>
          )}

          {/* Valores de depuración durante desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mt-1">
              Debug: Vendidos: {soldTickets}, Total: {raffle?.total_numbers},
              Porcentaje real: {soldPercentage.toFixed(2)}%,
              Animado: {animatedPercentage.toFixed(2)}%,
              Sold Out: {isSoldOut ? 'Sí' : 'No'}
            </div>
          )}
        </section>

        {/* Sección de números bendecidos */}
        {loading ? (
          <div className="w-full text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-80 mb-6"></div>
              <div className="flex flex-wrap justify-center gap-3">
                {[...Array(10)].map((_, index) => (
                  <div key={index} className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="w-full text-center text-red-500">
            <p>{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <BlessedNumbersSection
            blessedNumbers={blessedNumbers}
            onNumberClaimed={handleNumberClaimed}
          />
        )}

        {/* Información adicional */}
        <section className="w-full mb-8 text-gray-800 mt-3">
          <h3 className="text-xl font-semibold mb-2 text-center">¿Cómo puedo hacer para participar?</h3>
          {!isSoldOut ? (
            <>
              <p className="mb-2">Es muy sencillo, te lo explico en estos cuatro pasos ⤵️</p>
              <ol className="list-decimal list-inside space-y-2 pl-4 text-xs marker:font-bold">
                <li>
                  Selecciona el paquete de números que desees, es súper fácil. Recuerda que mientras más números tengas,
                  más oportunidades tendrás de ganar.
                </li>
                <li>
                  Serás redirigido a una página donde seleccionas tu forma de pago y llenarás tus datos.
                </li>
                <li>
                  Una vez realizado el pago, automáticamente y de manera aleatoria se asignarán tus números, los mismos que serán enviados
                  al correo electrónico registrado con la compra (revisa también tu bandeja de correo no deseado o spam).
                </li>
                <li>
                  Podrás revisarlos también en la parte de abajo en el apartado <strong>«Consulta tus números»</strong>.
                </li>
              </ol>
            </>
          ) : (
            <p className="mb-2 text-center">
              La venta de boletos ha finalizado. ¡Gracias a todos los participantes!
              Mantente atento para conocer la fecha del sorteo.
            </p>
          )}

          <div className="mt-6 flex justify-center">
            <button className="bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
              onClick={() => setIsVideoModalOpen(true)}>
              🎥 Ver video tutorial
            </button>
          </div>
        </section>

        {/* Opciones de tickets - Solo mostrar si no está sold out */}
        {!isSoldOut && (
          <section className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
            {ticketOptions.map((option) => {
              const isBestSeller = option.amount === 50;
              const isOptionSoldOut = option.amount > remainingTickets;
              return (
                <TicketCardWithToken
                  key={option.amount}
                  option={option}
                  bestSeller={isBestSeller}
                  isSoldOut={isOptionSoldOut}
                />
              );
            })}
          </section>
        )}

        {/* Card personalizada para ingresar cantidad - Solo mostrar si no está sold out */}
        {!isSoldOut && (
          <section className="w-full mt-6">
            <div className="bg-gray-100 border rounded-2xl p-6 shadow hover:shadow-lg transition text-center flex flex-col items-center">
              <h3 className="text-xl font-bold tracking-wide mb-4">¿Deseas más números?</h3>
              <label className="mb-2 text-sm text-gray-700" htmlFor="customAmount">
                Ingresa la cantidad de boletos que deseas comprar:
              </label>
              <input
                id="customAmount"
                type="number"
                min={1}
                max={remainingTickets}
                placeholder="Ej. 250"
                className="w-32 text-center px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={customAmount ?? ""}
                onChange={(e) => setCustomAmount(parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-600 mb-2">
                Quedan {remainingTickets} boletos disponibles
              </p>
              <button
                onClick={handleCustomBuyWithToken}
                className="bg-black text-white text-sm font-semibold px-4 py-2 rounded hover:bg-gray-800"
                disabled={isSoldOut}
              >
                COMPRAR
              </button>
            </div>
          </section>
        )}

        {/* Consulta tus números */}
        <section className="w-full mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">Consulta tus números</h2>
          <p className="mb-4 text-center">Ingresa tu correo electrónico para ver tus números asignados.</p>

          <form onSubmit={handleSearchTickets} className="flex flex-col items-center">
            <div className="flex justify-center mb-2 w-full max-w-md">
              <input
                type="email"
                placeholder="ej. correo@ejemplo.com"
                className="w-full text-center px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-black text-white text-sm font-semibold px-4 py-2 rounded-r hover:bg-gray-800"
                disabled={searchLoading}
              >
                {searchLoading ? 'Buscando...' : 'CONSULTAR'}
              </button>
            </div>

            {searchError && (
              <p className="text-red-500 text-sm mt-2">{searchError}</p>
            )}
          </form>

          <p className="text-gray-600 text-sm text-center mt-4">
            Recuerda que los números asignados son aleatorios y serán enviados a tu correo electrónico registrado.
            <br />
            Si no los encuentras, revisa tu bandeja de correo no deseado o spam.
          </p>
        </section>
      </main>

      {/* Modal para mostrar los números */}
      <TicketSearchModal
        isOpen={isModalOpen}
        onClose={closeModal}
        tickets={ticketPurchases}
      />
      <VideoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} />

      {/* Footer */}
      <footer className="w-full bg-[#800000] py-4 text-center text-white">
        <p className="text-sm">© 2023 GPC. Todos los derechos reservados.</p>
        <p className="text-sm">
          <a href="/privacy-policy" className="underline hover:text-gray-200">
            Política de Privacidad
          </a>
          {' '}|{' '}
          <a href="/terms-and-conditions" className="underline hover:text-gray-200">
            Términos y Condiciones
          </a>
        </p>
      </footer>

      {/* Botón de WhatsApp */}
      <a
        href="https://wa.me/593992319300"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition"
      >
        <Image
          src="/images/whasapp.png"
          alt="WhatsApp"
          width={30}
          height={30}
          className="w-7 h-7"
        />
      </a>
    </>
  );
}