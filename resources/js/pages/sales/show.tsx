import { Head, Link, useForm, usePage } from '@inertiajs/react';
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
import { create as createExchange } from '@/routes/exchanges';
import { create as createReturn } from '@/routes/returns';
import {
    index,
    print as printSale,
    receipt as receiptSale,
} from '@/routes/sales';
import {
    cancelled as cancelledStatus,
    completed as completedStatus,
    delivered as deliveredStatus,
    shipping as shippingStatus,
} from '@/routes/sales/status';

type Props = {
    sale: {
        id: number;
        invoice_no: string;
        customer_name: string | null;
        customer_phone: string | null;
        customer_address: string | null;
        status: string;
        total_amount: string;
        discount: string;
        final_amount: string;
        riel_exchange_rate: string;
        sold_at: string | null;
        available_transitions: string[];
        timeline: Array<{
            value: string;
            is_current: boolean;
            is_complete: boolean;
        }>;
        items: Array<{
            id: number;
            product_name: string;
            category_name: string;
            size: string;
            qty: number;
            sell_price: string;
            subtotal: string;
            cost_total: string;
            profit_total: string;
            allocations: Array<{
                id: number;
                qty: number;
                unit_cost: string;
                total_cost: string;
                purchase_reference_no: string | null;
                purchase_supplier_name: string | null;
                purchase_date: string | null;
            }>;
        }>;
    };
};

export default function SalesShow({ sale }: Props) {
    const { auth } = usePage().props;
    const statusForm = useForm({});
    const printForm = useForm({});
    const canManageStatuses = auth.user?.all_permissions.includes(
        'manage sale statuses',
    );

    const statusActions = {
        shipping: {
            label: 'Mark shipping',
            action: shippingStatus,
        },
        delivered: {
            label: 'Mark delivered',
            action: deliveredStatus,
        },
        completed: {
            label: 'Mark completed',
            action: completedStatus,
        },
        cancelled: {
            label: 'Cancel order',
            action: cancelledStatus,
        },
    } as const;

    return (
        <>
            <Head title={sale.invoice_no} />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title={sale.invoice_no}
                    description="Inspect invoice totals, sold items, and the exact FIFO batch costs allocated to each line."
                    action={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" asChild>
                                <Link href={index()} prefetch>
                                    Back to sales
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={receiptSale(sale.id)} prefetch>
                                    Receipt
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                disabled={printForm.processing}
                                onClick={() =>
                                    printForm.post(printSale.url(sale.id), {
                                        preserveScroll: true,
                                    })
                                }
                            >
                                Print
                            </Button>
                            {auth.user?.all_permissions.includes(
                                'manage returns',
                            ) ? (
                                <Button variant="outline" asChild>
                                    <Link href={createReturn(sale.id)} prefetch>
                                        Create return
                                    </Link>
                                </Button>
                            ) : null}
                            {auth.user?.all_permissions.includes(
                                'manage exchanges',
                            ) ? (
                                <Button variant="outline" asChild>
                                    <Link
                                        href={createExchange(sale.id)}
                                        prefetch
                                    >
                                        Create exchange
                                    </Link>
                                </Button>
                            ) : null}
                            {canManageStatuses
                                ? sale.available_transitions.map(
                                      (transition) => {
                                          const config =
                                              statusActions[
                                                  transition as keyof typeof statusActions
                                              ];

                                          return (
                                              <Button
                                                  key={transition}
                                                  variant={
                                                      transition === 'cancelled'
                                                          ? 'destructive'
                                                          : 'default'
                                                  }
                                                  disabled={
                                                      statusForm.processing
                                                  }
                                                  onClick={() =>
                                                      statusForm.patch(
                                                          config.action.url(
                                                              sale.id,
                                                          ),
                                                          {
                                                              preserveScroll: true,
                                                          },
                                                      )
                                                  }
                                              >
                                                  {config.label}
                                              </Button>
                                          );
                                      },
                                  )
                                : null}
                        </div>
                    }
                />

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                            <CardDescription>Order state</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="secondary">{sale.status}</Badge>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Sold at</CardTitle>
                            <CardDescription>Checkout time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">
                                {formatDateTime(sale.sold_at)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer</CardTitle>
                            <CardDescription>Buyer details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">
                                {sale.customer_name ?? 'Walk-in customer'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {sale.customer_phone ?? '-'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Final amount</CardTitle>
                            <CardDescription>USD and Riel</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold">
                                {formatCurrency(sale.final_amount)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {formatNumber(
                                    Number(sale.final_amount) *
                                        Number(sale.riel_exchange_rate),
                                )}{' '}
                                Riel
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Status timeline</CardTitle>
                        <CardDescription>
                            Track where this sale sits in the delivery
                            lifecycle.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-5">
                        {sale.timeline.map((entry) => (
                            <div
                                key={entry.value}
                                className="rounded-lg border p-4"
                            >
                                <Badge
                                    variant={
                                        entry.is_current
                                            ? 'secondary'
                                            : entry.is_complete
                                              ? 'outline'
                                              : 'outline'
                                    }
                                >
                                    {entry.value}
                                </Badge>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {entry.is_current
                                        ? 'Current status'
                                        : entry.is_complete
                                          ? 'Completed'
                                          : 'Pending'}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sale items</CardTitle>
                        <CardDescription>
                            Each line stores the exact sell subtotal, FIFO cost,
                            and resulting profit.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {sale.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col gap-4 rounded-lg border p-4"
                            >
                                <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
                                    <div>
                                        <p className="font-medium">
                                            {item.product_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.category_name} / {item.size}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Qty
                                        </p>
                                        <p className="font-medium">
                                            {formatNumber(item.qty)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Sell
                                        </p>
                                        <p className="font-medium">
                                            {formatCurrency(item.sell_price)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Cost
                                        </p>
                                        <p className="font-medium">
                                            {formatCurrency(item.cost_total)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Profit
                                        </p>
                                        <p className="font-medium">
                                            {formatCurrency(item.profit_total)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4">
                                    <p className="text-sm font-medium">
                                        FIFO allocations
                                    </p>
                                    {item.allocations.map((allocation) => (
                                        <div
                                            key={allocation.id}
                                            className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr]"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {allocation.purchase_reference_no ??
                                                        `Batch #${allocation.id}`}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {allocation.purchase_supplier_name ??
                                                        'No supplier'}{' '}
                                                    /{' '}
                                                    {formatDateTime(
                                                        allocation.purchase_date,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                                    Qty
                                                </p>
                                                <p className="font-medium">
                                                    {formatNumber(
                                                        allocation.qty,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                                    Unit cost
                                                </p>
                                                <p className="font-medium">
                                                    {formatCurrency(
                                                        allocation.unit_cost,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                                    Total cost
                                                </p>
                                                <p className="font-medium">
                                                    {formatCurrency(
                                                        allocation.total_cost,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SalesShow.layout = {
    breadcrumbs: [
        {
            title: 'Sales',
            href: index(),
        },
        {
            title: 'Sale detail',
            href: index(),
        },
    ],
};
