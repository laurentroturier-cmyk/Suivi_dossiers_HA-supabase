import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Offer } from './types';

interface Props {
  offers: Offer[];
}

const TrendChart: React.FC<Props> = ({ offers }) => {
  // Sort by final rank to show progression from winner to last place
  const sortedOffers = [...offers].sort((a, b) => a.rankFinal - b.rankFinal);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={sortedOffers}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 12)}...` : val}
            interval="preserveStartEnd"
            padding={{ left: 20, right: 20 }}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }}/>
          <Line 
            type="monotone" 
            dataKey="scoreTechnical" 
            name="Note Technique" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
            animationDuration={1500}
          />
          <Line 
            type="monotone" 
            dataKey="scoreFinancial" 
            name="Note Financière" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;