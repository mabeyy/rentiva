import { format, parseISO } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { formatPeso } from '@/lib/format';
import type { DailyRevenue } from '@/types';

const chartConfig = {
    total: { label: 'Booking value', color: 'var(--chart-1)' },
} satisfies ChartConfig;

/**
 * Single-series bar chart of confirmed booking value per pickup day.
 */
export function RevenueChart({ data }: { data: DailyRevenue[] }) {
    return (
        <ChartContainer
            config={chartConfig}
            className="aspect-auto h-64 w-full"
        >
            <BarChart data={data} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} strokeOpacity={0.5} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={16}
                    tickFormatter={(date: string) =>
                        format(parseISO(date), 'MMM d')
                    }
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={64}
                    tickFormatter={(value: number) => formatPeso(value)}
                />
                <ChartTooltip
                    cursor={{ fillOpacity: 0.3 }}
                    content={
                        <ChartTooltipContent
                            labelFormatter={(_, payload) =>
                                format(
                                    parseISO(String(payload[0]?.payload.date)),
                                    'EEE, MMM d',
                                )
                            }
                            formatter={(value) => formatPeso(Number(value))}
                        />
                    }
                />
                <Bar
                    dataKey="total"
                    fill="var(--color-total)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                />
            </BarChart>
        </ChartContainer>
    );
}
