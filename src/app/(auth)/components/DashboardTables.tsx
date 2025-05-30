'use client';

import { useEffect, useState } from 'react';
import { getInvoicesList } from '../services/invoicesService';
import { getBlessedNumbers } from '../services/blessedService';
import { getWinners } from '../services/winnersService';
import { getRaffleEntries } from '../services/rafflesService';
import DataTable from './DataTable';
import RaffleEntryModal from './RaffleEntryModal';

export default function DashboardTables() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [blessed, setBlessed] = useState<any[]>([]);
    const [winners, setWinners] = useState<any[]>([]);
    const [raffleEntries, setRafflesEntries] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSuccess = () => {
        getRaffleEntries().then(setRafflesEntries).catch(console.error);
    };

    const fetchData = () => {
        getInvoicesList().then(setInvoices).catch(console.error);
        getBlessedNumbers().then(setBlessed).catch(console.error);
        getWinners().then(setWinners).catch(console.error);
        getRaffleEntries().then(setRafflesEntries).catch(console.error);
    };

    useEffect(() => {
        fetchData();

    }, []);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Tabla de Facturas */}
                <DataTable
                    title="Facturas"
                    data={invoices}
                    columns={[
                        { key: 'order_number', label: 'Número de orden' },
                        { key: 'full_name', label: 'Nombre' },
                        { key: 'phone', label: 'Teléfono' },
                        { key: 'amount', label: 'Cantidad' },
                        { key: 'total_price', label: 'Total' },
                        { key: 'status', label: 'Estado', isStatus: true },
                    ]}
                    actions={{ read: false, edit: false, delete: false }}
                    searchable
                />

                {/* Tabla de Bendecidos */}
                <DataTable
                    title="Números Bendecidos"
                    data={blessed}
                    columns={[
                        { key: 'number', label: 'Número' },
                        { key: 'name', label: 'Participante' },
                        { key: 'email', label: 'Email' },
                        { key: 'is_minor_prize', label: 'Premio Menor' },
                    ]}
                    actions={{ read: false, edit: false, delete: false }}
                    searchable
                    customActions={(row) => [
                        {
                            label: 'Dar por recibido',
                            onClick: () => console.log('Detalles de', row),
                            confirm: true,
                        },
                    ]}
                />


                {/* Tabla de Ganadores */}
                <DataTable
                    title="Ganadores"
                    data={winners}
                    columns={[
                        { key: 'name', label: 'Nombre' },
                        { key: 'email', label: 'Email' },
                        { key: 'phone', label: 'Teléfono' },
                        { key: 'total', label: 'Cant. Números' },
                    ]}
                    actions={{ read: false, edit: false, delete: false }}
                    searchable
                />

                {/* Tabla de Rifas Entrantantes */}
                <DataTable
                    title="Entrantes Rifas"
                    data={raffleEntries}
                    columns={[
                        { key: 'number', label: 'Número' },
                        { key: 'is_winner', label: 'Ganador', isStatus: false },
                        { key: 'purchased_at', label: 'Comprado el' },
                    ]}
                    actions={{ read: false, edit: false, delete: false, create: true }}
                    searchable
                    onAction={{
                        onCreate: handleCreateClick,
                    }}
                />
            </div>

            {/* Modal para registrar nuevos números */}
            <RaffleEntryModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
            />
        </>
    );
}
