import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Brush } from 'recharts';
import { Offer } from './types';

interface Props {
  offers: Offer[];
  average: number;
}

const PriceChart: React.FC<Props> = ({ offers, average }) => {
  // Sort for better visualization in price chart usually, but let's keep original order or rank order
  const sortedOffers = [...offers].sort((a, b) => a.rankFinal - b.rankFinal);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedOffers}
          margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false} 
            minTickGap={10}
          />
          <YAxis 
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            formatter={(value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            cursor={{ fill: '#f3f4f6' }}
          />
          <ReferenceLine y={average} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Moyenne', fill: '#ef4444', fontSize: 10 }} />
          <Brush 
            dataKey="name" 
            height={20} 
            stroke="#d1d5db" 
            fill="#f9fafb"
            tickFormatter={() => ""}
            travellerWidth={10}
          />
          <Bar dataKey="amountTTC" radius={[4, 4, 0, 0]}>
            {sortedOffers.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.rankFinal === 1 ? '#4ade80' : '#d1d5db'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;