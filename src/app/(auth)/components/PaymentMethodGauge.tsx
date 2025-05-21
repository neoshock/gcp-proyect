'use client';

import { PieChart, Pie, Cell } from 'recharts';

interface Props {
  transferPercentage: number;
  stripePercentage: number;
}

const COLORS = ['#8B0000', '#CCCCCC'];

export default function PaymentMethodGaugeMini({
  transferPercentage,
  stripePercentage,
}: Props) {
  const data = [
    { name: 'Transferencia', value: transferPercentage },
    { name: 'Pago en Línea', value: stripePercentage },
  ];

  return (
    <div className="flex items-center space-x-4">
      {/* Gráfico */}
      <PieChart width={100} height={60}>
        <Pie
          data={data}
          innerRadius={20}
          outerRadius={30}

          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
      {/* Leyenda */}
      <div className="space-y-1 text-sm text-gray-700">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
          <span className='text-xs font-normal'>Transferencia ({transferPercentage.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }} />
          <span className='text-xs font-normal'>Pago en Línea ({stripePercentage.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
}
