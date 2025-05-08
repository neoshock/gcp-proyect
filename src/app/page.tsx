'use client';
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

// Importamos nuestros servicios y tipos
import { getBlessedNumbers, getSoldTicketsCount, getUserTickets } from "./services/numberService";
import { BlessedNumber, TicketOption, TicketPurchase } from "./types/tickets";
import { BlessedNumbersSection } from "./components/BlessedNumbersSection";
import { TicketSearchModal } from "./components/TicketSearchModal";
import { getActiveRaffle } from "./services/raffleService";
import { Raffle } from "./types/raffles";


function TicketCard({ option }: { option: TicketOption }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/checkout?amount=${option.amount}&price=${option.price}`);
  };

  return (
    <div
      className="bg-gray-100 border rounded-2xl p-6 shadow hover:shadow-lg transition text-center cursor-pointer flex flex-col items-center"
      onClick={handleClick}
    >
      <h3 className="text-xl font-bold tracking-wide mb-2">x{option.amount} NÚMEROS</h3>
      <p className="text-2xl font-bold mb-4">${option.price}</p>
      <button
        className="bg-black text-white text-sm font-semibold px-4 py-2 rounded hover:bg-gray-800"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        COMPRAR
      </button>
    </div>
  );
}



export default function Home() {
  const [soldTickets, setSoldTickets] = useState(350);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [blessedNumbers, setBlessedNumbers] = useState<BlessedNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raffle, setRaffle] = useState<Raffle | null>(null);

  // Estados para la consulta de tickets
  const [searchEmail, setSearchEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketPurchases, setTicketPurchases] = useState<TicketPurchase[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const baseAmounts = [10, 15, 20, 30, 50, 100];

  const ticketOptions: TicketOption[] = raffle
    ? baseAmounts.map((amount) => ({
      amount,
      price: amount * raffle.price,
    }))
    : [];


  const soldPercentage = raffle ? Math.min((soldTickets / raffle.totalNumbers) * 100, 100) : 0;
  const router = useRouter();

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

  const handleCustomBuy = async () => {
    // validar que la cantidad sea mayor a 10$ 
    const toalPrice = customAmount ? customAmount * raffle!.price : 0;
    if (toalPrice < 10) {
      alert("La cantidad mínima a comprar es de 10$");
      return;
    }
    // redirigir a la página de checkout
    router.push(`/checkout?amount=${customAmount}&price=${toalPrice}`);
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
      <header className="w-full bg-[#800000] py-4 text-center">
        <h1 className="text-white text-7xl font-extrabold tracking-wide">GPC</h1>
      </header>
      <main className="flex flex-col items-center p-4 max-w-4xl mx-auto">

        {/* Título destacado */}
        <section className="text-center mt-6 mb-4 px-4">
          <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
            {`Se parte del Proyecto Colorado y por ${raffle?.price ?? 1} dólar\nGana $10,000 en premios...`}
          </h2>

        </section>

        {/* Imagen del premio */}
        <div className="w-full mb-6">
          <div className="w-full mb-6">
            <Image
              src="/images/portada.png"
              alt="Premio"
              layout="intrinsic"
              width={800}
              height={400}
              className="rounded-2xl shadow-md w-full h-auto"
            />
          </div>
        </div>

        {/* Sección de números bendecidos */}
        {loading ? (
          <div className="w-full text-center py-8">
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
          <div className="w-full text-center py-8 text-red-500">
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

        {/* Descripción */}
        <section className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">{raffle?.description ?? "Participa por el sorteo"}</h2>
          <p className="text-gray-600">Participa comprando uno o más boletos. ¡Mientras más compres, más chances tienes!</p>
        </section>

        {/* Barra de progreso */}
        <section className="w-full mb-8">
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className="bg-green-500 h-full text-xs text-white text-center leading-6"
              style={{ width: `${soldPercentage}%` }}
            >
              {Math.floor(soldTickets)} / {raffle?.totalNumbers ?? 0} boletos vendidos
            </div>
          </div>
        </section>

        {/* Información adicional */}
        <section className="w-full mb-8 text-gray-800">
          <p className="mb-4 text-center font-medium">
            Cuando la barra llegue al 100% daremos por finalizado y procederemos a realizar el sorteo entre todos los participantes.
            Se tomarán los 5 números de la primera y segunda suerte del programa <strong>LOTERIA NACIONAL</strong>.
          </p>

          <h3 className="text-xl font-semibold mb-2 text-center">¿Cómo puedo hacer para participar?</h3>
          <p className="mb-2">Es muy sencillo, te lo explico en estos cuatro pasos ⤵️</p>
          <ol className="list-decimal list-inside space-y-2 pl-4">
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

          <div className="mt-6 flex justify-center">
            <button className="bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition">
              🎥 Ver video tutorial
            </button>
          </div>
        </section>

        {/* Opciones de tickets */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
          {ticketOptions.map((option) => (
            <TicketCard key={option.amount} option={option} />
          ))}
        </section>

        {/* Card personalizada para ingresar cantidad */}
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
              placeholder="Ej. 250"
              className="w-32 text-center px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={customAmount ?? ""}
              onChange={(e) => setCustomAmount(parseInt(e.target.value))}
            />
            <button
              onClick={handleCustomBuy}
              className="bg-black text-white text-sm font-semibold px-4 py-2 rounded hover:bg-gray-800"
            >
              COMPRAR
            </button>
          </div>
        </section>

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

      {/* Footer */}
      <footer className="w-full bg-[#800000] py-4 text-center text-white">
        <p className="text-sm">© 2023 GPC. Todos los derechos reservados.</p>
        <p className="text-sm">Consulta los términos y condiciones en nuestro sitio web.</p>
      </footer>

      {/* Botón de WhatsApp */}
      <a
        href="https://wa.me/5491155555555"
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