import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRightLeft,
    CreditCard,
    DollarSign,
    PackageSearch,
    RotateCcw,
    Settings2,
    ShieldCheck,
    ShoppingBag,
    Users,
} from 'lucide-react';
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
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import { dashboard } from '@/routes';
import { edit as editBusinessSettings } from '@/routes/business-settings';
import { index as posIndex } from '@/routes/pos';
import { index as rolesIndex } from '@/routes/roles';
import { index as salesIndex, show as salesShow } from '@/routes/sales';
import { show as stockShow } from '@/routes/stock';
import { index as usersIndex } from '@/routes/users';

type Props = {
    summary: {
        orders_today: number;
        shirts_sold_today: number;
        sales_today: number;
        cost_today: number;
        profit_today: number;
        returns_today: number;
        refunds_today: number;
        exchanges_today: number;
        exchange_difference_today: number;
    };
    recentSales: Array<{
        id: number;
        invoice_no: string;
        customer_name: string | null;
        final_amount: string;
        sold_at: string | null;
        status: string;
    }>;
    recentReturns: Array<{
        id: number;
        reference_no: string;
        invoice_no: string;
        refund_total: string;
        returned_at: string | null;
    }>;
    recentExchanges: Array<{
        id: number;
        reference_no: string;
        invoice_no: string;
        difference_total: string;
        exchanged_at: string | null;
    }>;
    lowStockVariants: Array<{
        id: number;
        product_name: string;
        category_name: string;
        size: string;
        current_stock: number;
    }>;
    lowStockThreshold: number;
};

export default function Dashboard({
    summary,
    recentSales,
    recentReturns,
    recentExchanges,
    lowStockVariants,
    lowStockThreshold,
}: Props) {
    const { auth } = usePage().props;
    const permissions = new Set(auth.user?.all_permissions ?? []);

    const quickActions = [
        {
            title: 'Start checkout',
            description:
                'Open the POS and complete a sale using live stock and FIFO costing.',
            href: posIndex(),
            icon: CreditCard,
            permission: 'create sales',
        },
        {
            title: 'Review sales',
            description:
                'Browse recent invoices and inspect their stored allocation details.',
            href: salesIndex(),
            icon: ShoppingBag,
            permission: 'view sales',
        },
        {
            title: 'Users',
            description:
                'Manage staff accounts, assigned roles, and direct overrides.',
            href: usersIndex(),
            icon: Users,
            permission: 'manage users',
        },
        {
            title: 'Roles',
            description:
                'Define reusable permission bundles for admins, managers, and cashiers.',
            href: rolesIndex(),
            icon: ShieldCheck,
            permission: 'manage roles',
        },
        {
            title: 'Business settings',
            description:
                'Configure invoice numbering and the current USD to Riel exchange rate.',
            href: editBusinessSettings(),
            icon: Settings2,
            permission: 'manage business settings',
        },
    ].filter(
        (action) =>
            action.permission === undefined ||
            permissions.has(action.permission),
    );

    const stats = [
        {
            title: 'Orders today',
            value: formatNumber(summary.orders_today),
            description: 'Completed checkouts recorded today.',
            icon: ShoppingBag,
        },
        {
            title: 'Shirts sold',
            value: formatNumber(summary.shirts_sold_today),
            description: 'Total quantities sold across all invoice lines.',
            icon: CreditCard,
        },
        {
            title: 'Sales today',
            value: formatCurrency(summary.sales_today),
            description: 'Final invoice totals after discount.',
            icon: DollarSign,
        },
        {
            title: 'Cost today',
            value: formatCurrency(summary.cost_today),
            description: 'Exact FIFO cost consumed from stock batches.',
            icon: PackageSearch,
        },
        {
            title: 'Profit today',
            value: formatCurrency(summary.profit_today),
            description: 'Revenue minus the persisted FIFO cost totals.',
            icon: DollarSign,
        },
        {
            title: 'Refunds today',
            value: formatCurrency(summary.refunds_today),
            description: `${formatNumber(summary.returns_today)} return records created today.`,
            icon: RotateCcw,
        },
        {
            title: 'Exchange delta',
            value: formatCurrency(summary.exchange_difference_today),
            description: `${formatNumber(summary.exchanges_today)} exchanges processed today.`,
            icon: ArrowRightLeft,
        },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Clothing POS"
                    description="Daily operational summary built from real sales, stock, and FIFO allocation data."
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                                <div className="flex flex-col gap-1.5">
                                    <CardDescription>
                                        {stat.title}
                                    </CardDescription>
                                    <CardTitle className="text-2xl tracking-tight">
                                        {stat.value}
                                    </CardTitle>
                                </div>
                                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <stat.icon />
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                {stat.description}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent sales</CardTitle>
                            <CardDescription>
                                The latest completed sales with their final
                                invoice amounts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {recentSales.length > 0 ? (
                                recentSales.map((sale) => (
                                    <div
                                        key={sale.id}
                                        className="flex items-center justify-between gap-4 rounded-lg border p-4"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <Link
                                                href={salesShow(sale.id)}
                                                className="font-medium hover:underline"
                                                prefetch
                                            >
                                                {sale.invoice_no}
                                            </Link>
                                            <p className="text-sm text-muted-foreground">
                                                {sale.customer_name ??
                                                    'Walk-in customer'}{' '}
                                                / {formatDateTime(sale.sold_at)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="secondary">
                                                {sale.status}
                                            </Badge>
                                            <p className="mt-2 font-medium">
                                                {formatCurrency(
                                                    sale.final_amount,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                    No sales recorded yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Returns and exchanges</CardTitle>
                                <CardDescription>
                                    Recent post-sale corrections and the money
                                    movement they created.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                {recentReturns.length === 0 &&
                                recentExchanges.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                        No return or exchange activity yet.
                                    </div>
                                ) : (
                                    <>
                                        {recentReturns.map((entry) => (
                                            <div
                                                key={entry.reference_no}
                                                className="flex items-center justify-between gap-4 rounded-lg border p-4"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <p className="font-medium">
                                                        {entry.reference_no}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {entry.invoice_no} /{' '}
                                                        {formatDateTime(
                                                            entry.returned_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">
                                                    Refund{' '}
                                                    {formatCurrency(
                                                        entry.refund_total,
                                                    )}
                                                </Badge>
                                            </div>
                                        ))}
                                        {recentExchanges.map((entry) => (
                                            <div
                                                key={entry.reference_no}
                                                className="flex items-center justify-between gap-4 rounded-lg border p-4"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <p className="font-medium">
                                                        {entry.reference_no}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {entry.invoice_no} /{' '}
                                                        {formatDateTime(
                                                            entry.exchanged_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">
                                                    Delta{' '}
                                                    {formatCurrency(
                                                        entry.difference_total,
                                                    )}
                                                </Badge>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Low stock watchlist</CardTitle>
                                <CardDescription>
                                    Variants with{' '}
                                    {formatNumber(lowStockThreshold)} or fewer
                                    pieces remaining.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                {lowStockVariants.length > 0 ? (
                                    lowStockVariants.map((variant) => (
                                        <Link
                                            key={variant.id}
                                            href={stockShow(variant.id)}
                                            className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-muted/30"
                                            prefetch
                                        >
                                            <div className="flex flex-col gap-1">
                                                <p className="font-medium">
                                                    {variant.product_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {variant.category_name} /{' '}
                                                    {variant.size}
                                                </p>
                                            </div>
                                            <Badge variant="outline">
                                                {formatNumber(
                                                    variant.current_stock,
                                                )}{' '}
                                                left
                                            </Badge>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                        No low stock variants right now.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick actions</CardTitle>
                                <CardDescription>
                                    Jump straight into the workflows used most
                                    often.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                                {quickActions.map((action) => (
                                    <div
                                        key={action.title}
                                        className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <action.icon />
                                            </div>
                                            <h3 className="font-medium">
                                                {action.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {action.description}
                                        </p>
                                        <Button
                                            variant="outline"
                                            asChild
                                            className="w-full"
                                        >
                                            <Link href={action.href} prefetch>
                                                Open
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
