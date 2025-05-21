import { ReactNode } from 'react';

interface DashboardMetricCardProps {
    icon: ReactNode;
    title: string;
    value: ReactNode; 
}

export default function DashboardMetricCard({ icon, title, value }: DashboardMetricCardProps) {
    return (
        <div className="flex items-center p-4 bg-white rounded-2xl shadow-md space-x-4">
            <div className="text-3xl text-maroon">{icon}</div>
            <div>
                <h3 className="text-sm text-gray-600">{title}</h3>
                <div className="mt-1 text-2xl font-bold">{value}</div>
            </div>
        </div>
    );
}
