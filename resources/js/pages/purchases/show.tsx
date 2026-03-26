import { Head, Link } from '@inertiajs/react';
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
import { create, index } from '@/routes/purchases';

type Props = {
    purchase: {
        id: number;
        reference_no: string | null;
        supplier_name: string | null;
        purchased_at: string | null;
        note: string | null;
        items: Array<{
            id: number;
            product_name: string;
            category_name: string;
            size: string;
            qty: number;
            remaining_qty: number;
            cost_price: string;
            suggested_sell_price: string | null;
        }>;
    };
};

export default function PurchaseShow({ purchase }: Props) {
    return (
        <>
            <Head title={purchase.reference_no ?? `Purchase #${purchase.id}`} />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title={purchase.reference_no ?? `Purchase #${purchase.id}`}
                    description="Review the exact batches created by this purchase and the remaining stock still available from them."
                    action={
                        <Button asChild>
                            <Link href={create()} prefetch>
                                New purchase
                            </Link>
                        </Button>
                    }
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Supplier</CardTitle>
                            <CardDescription>
                                Recorded supplier information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">
                                {purchase.supplier_name ?? 'No supplier'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Purchased at</CardTitle>
                            <CardDescription>
                                Batch order timestamp
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">
                                {formatDateTime(purchase.purchased_at)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Line items</CardTitle>
                            <CardDescription>
                                FIFO batches created
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">
                                {formatNumber(purchase.items.length)} lines
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Batch details</CardTitle>
                        <CardDescription>
                            Each line remains independently traceable for stock,
                            cost, and later FIFO sales allocation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {purchase.items.map((item) => (
                            <div
                                key={item.id}
                                className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]"
                            >
                                <div className="flex flex-col gap-1">
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
                                        Remaining
                                    </p>
                                    <p className="font-medium">
                                        {formatNumber(item.remaining_qty)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Cost
                                    </p>
                                    <p className="font-medium">
                                        {formatCurrency(item.cost_price)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Suggested sell
                                    </p>
                                    <p className="font-medium">
                                        {item.suggested_sell_price === null
                                            ? '-'
                                            : formatCurrency(
                                                  item.suggested_sell_price,
                                              )}
                                    </p>
                                </div>
                                <div className="flex items-center justify-start lg:justify-end">
                                    <Badge
                                        variant={
                                            item.remaining_qty > 0
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                    >
                                        {item.remaining_qty > 0
                                            ? 'Available'
                                            : 'Depleted'}
                                    </Badge>
                                </div>
                            </div>
                        ))}

                        {purchase.note ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                Note: {purchase.note}
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PurchaseShow.layout = {
    breadcrumbs: [
        {
            title: 'Purchases',
            href: index(),
        },
        {
            title: 'Purchase detail',
            href: index(),
        },
    ],
};
