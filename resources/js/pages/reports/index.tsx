import { Head, router, useForm } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatNumber } from '@/lib/format';
import { index } from '@/routes/reports';

type Props = {
    filters: {
        start_date: string;
        end_date: string;
    };
    summary: {
        orders_count: number;
        shirts_sold: number;
        sales_total: number;
        gross_sales_total: number;
        discount_total: number;
        cost_total: number;
        profit_total: number;
        returns_count: number;
        refund_total: number;
        exchanges_count: number;
        exchange_difference_total: number;
    };
    topProducts: Array<{
        product_name: string;
        quantity_total: number;
        sales_total: number;
    }>;
    topSizes: Array<{
        size: string;
        quantity_total: number;
    }>;
};

export default function ReportsIndex({
    filters,
    summary,
    topProducts,
    topSizes,
}: Props) {
    const form = useForm({
        start_date: filters.start_date,
        end_date: filters.end_date,
    });

    const stats = [
        { title: 'Orders', value: formatNumber(summary.orders_count) },
        { title: 'Shirts sold', value: formatNumber(summary.shirts_sold) },
        { title: 'Net sales', value: formatCurrency(summary.sales_total) },
        { title: 'Cost', value: formatCurrency(summary.cost_total) },
        { title: 'Profit', value: formatCurrency(summary.profit_total) },
        { title: 'Refunds', value: formatCurrency(summary.refund_total) },
    ];

    return (
        <>
            <Head title="Reports" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Reports"
                    description="Operational reporting for sales, refunds, exchanges, and top-performing products across a selected date range."
                />

                <Card>
                    <CardContent className="pt-6">
                        <form
                            className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"
                            onSubmit={(event) => {
                                event.preventDefault();
                                router.get(
                                    index.url({ query: form.data }),
                                    {},
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                        replace: true,
                                    },
                                );
                            }}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="start_date">Start date</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={form.data.start_date}
                                    onChange={(event) =>
                                        form.setData(
                                            'start_date',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end_date">End date</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={form.data.end_date}
                                    onChange={(event) =>
                                        form.setData(
                                            'end_date',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button type="submit">Apply</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const today = new Date()
                                            .toISOString()
                                            .slice(0, 10);
                                        const monthStart = new Date();
                                        monthStart.setDate(1);

                                        form.setData({
                                            start_date: monthStart
                                                .toISOString()
                                                .slice(0, 10),
                                            end_date: today,
                                        });

                                        router.get(
                                            index.url({
                                                query: {
                                                    start_date: monthStart
                                                        .toISOString()
                                                        .slice(0, 10),
                                                    end_date: today,
                                                },
                                            }),
                                            {},
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                >
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardHeader>
                                <CardDescription>{stat.title}</CardDescription>
                                <CardTitle className="text-2xl tracking-tight">
                                    {stat.value}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Commercial summary</CardTitle>
                            <CardDescription>
                                Revenue movement for the selected date range.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-lg border p-4">
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Gross sales
                                </p>
                                <p className="mt-2 text-xl font-semibold">
                                    {formatCurrency(summary.gross_sales_total)}
                                </p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Discount total
                                </p>
                                <p className="mt-2 text-xl font-semibold">
                                    {formatCurrency(summary.discount_total)}
                                </p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Return records
                                </p>
                                <p className="mt-2 text-xl font-semibold">
                                    {formatNumber(summary.returns_count)}
                                </p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Exchange records
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <p className="text-xl font-semibold">
                                        {formatNumber(summary.exchanges_count)}
                                    </p>
                                    <Badge variant="outline">
                                        Delta{' '}
                                        {formatCurrency(
                                            summary.exchange_difference_total,
                                        )}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top sizes</CardTitle>
                            <CardDescription>
                                Highest-selling sizes in the selected range.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            {topSizes.length > 0 ? (
                                topSizes.map((size) => (
                                    <div
                                        key={size.size}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <Badge variant="secondary">
                                            {size.size}
                                        </Badge>
                                        <span className="font-medium">
                                            {formatNumber(size.quantity_total)}{' '}
                                            sold
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                    No size activity in this date range.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Top products</CardTitle>
                        <CardDescription>
                            The strongest products by quantity sold and gross
                            line sales.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {topProducts.length > 0 ? (
                            topProducts.map((product) => (
                                <div
                                    key={product.product_name}
                                    className="flex items-center justify-between rounded-lg border p-4"
                                >
                                    <div className="flex flex-col gap-1">
                                        <p className="font-medium">
                                            {product.product_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatNumber(
                                                product.quantity_total,
                                            )}{' '}
                                            sold
                                        </p>
                                    </div>
                                    <p className="font-medium">
                                        {formatCurrency(product.sales_total)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                No product sales in this date range.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: index(),
        },
    ],
};
