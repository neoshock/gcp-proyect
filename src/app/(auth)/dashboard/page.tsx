'use client';

import { useEffect, useState } from 'react';
import { getDashboardMetrics } from '../services/metricsService';
import DashboardMetricCard from '../components/DashboardMetricCard';
import DashboardTables from '../components/DashboardTables';
import { DollarSign, Hash, Trophy, PieChart } from 'lucide-react';
import PaymentMethodGaugeMini from '../components/PaymentMethodGauge';

export default function DashboardPage() {

    const [metrics, setMetrics] = useState<{
        totalSales: number;
        totalNumbersSold: number;
        totalWinners: number;
        conversionRate: number;
        transferSales: number;
        stripeSales: number;
        transferPercentage: number;
        stripePercentage: number;
    } | null>(null);


    useEffect(() => {
        getDashboardMetrics().then(setMetrics).catch(console.error);
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Panel Administrativo</h1>
            {metrics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardMetricCard
                        icon={<DollarSign />}
                        title="Total Ventas"
                        value={`$${metrics.totalSales.toFixed(2)}`}
                    />
                    <DashboardMetricCard
                        icon={<Hash />}
                        title="Números Vendidos"
                        value={metrics.totalNumbersSold}
                    />
                    <DashboardMetricCard
                        icon={<Trophy />}
                        title="Ganadores"
                        value={metrics.totalWinners}
                    />
                    <DashboardMetricCard
                        icon={<PieChart />}
                        title="Método de Pago"
                        value={
                            <PaymentMethodGaugeMini
                                transferPercentage={metrics.transferPercentage}
                                stripePercentage={metrics.stripePercentage}
                            />
                        }
                    />
                </div>
            ) : (
                <p className="text-gray-500">Cargando métricas...</p>
            )}
            <DashboardTables />
        </div>
    );
}
