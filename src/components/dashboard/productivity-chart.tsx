'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const data: any[] = [];

export default function ProductivityChart() {
  return (
    <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                    }}
                />
                <Legend wrapperStyle={{fontSize: "14px"}} />
                <Bar dataKey="trabalhados" name="Dias Trabalhados" fill="hsl(var(--primary))" />
                <Bar dataKey="faltas" name="Faltas" fill="hsl(var(--destructive))" />
                <Bar dataKey="extras" name="Horas Extras" fill="hsl(var(--accent))" />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
