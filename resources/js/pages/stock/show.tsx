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
import { index } from '@/routes/stock';

type Props = {
    variant: {
        id: number;
        product_name: string;
        category_name: string;
        size: string;
        sku: string | null;
        current_stock: number;
        batches: Array<{
            id: number;
            reference_no: string | null;
            supplier_name: string | null;
            purchased_at: string | null;
            qty: number;
            remaining_qty: number;
            cost_price: string;
            suggested_sell_price: string | null;
        }>;
    };
};

export default function StockShow({ variant }: Props) {
    return (
        <>
            <Head title={`${variant.product_name} ${variant.size}`} />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title={`${variant.product_name} / ${variant.size}`}
                    description="Batch-level stock visibility for exact FIFO allocation and trusted inventory review."
                    action={
                        <Button variant="outline" asChild>
                            <Link href={index()} prefetch>
                                Back to stock
                            </Link>
                        </Button>
                    }
                />

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Category</CardTitle>
                            <CardDescription>Catalog grouping</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">
                                {variant.category_name}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Size</CardTitle>
                            <CardDescription>Variant size</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="outline">{variant.size}</Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>SKU</CardTitle>
                            <CardDescription>
                                Optional identifier
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">{variant.sku ?? '-'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Current stock</CardTitle>
                            <CardDescription>
                                Remaining FIFO quantity
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {formatNumber(variant.current_stock)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Batch breakdown</CardTitle>
                        <CardDescription>
                            Oldest purchases are the batches that should be
                            consumed first during checkout.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {variant.batches.map((batch) => (
                            <div
                                key={batch.id}
                                className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]"
                            >
                                <div className="flex flex-col gap-1">
                                    <p className="font-medium">
                                        {batch.reference_no ??
                                            `Batch #${batch.id}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {batch.supplier_name ?? 'No supplier'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDateTime(batch.purchased_at)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Qty
                                    </p>
                                    <p className="font-medium">
                                        {formatNumber(batch.qty)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Remaining
                                    </p>
                                    <p className="font-medium">
                                        {formatNumber(batch.remaining_qty)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Cost
                                    </p>
                                    <p className="font-medium">
                                        {formatCurrency(batch.cost_price)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Suggested sell
                                    </p>
                                    <p className="font-medium">
                                        {batch.suggested_sell_price === null
                                            ? '-'
                                            : formatCurrency(
                                                  batch.suggested_sell_price,
                                              )}
                                    </p>
                                </div>
                                <div className="flex items-center justify-start lg:justify-end">
                                    <Badge
                                        variant={
                                            batch.remaining_qty > 0
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                    >
                                        {batch.remaining_qty > 0
                                            ? 'Available'
                                            : 'Consumed'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

StockShow.layout = {
    breadcrumbs: [
        {
            title: 'Stock',
            href: index(),
        },
        {
            title: 'Stock detail',
            href: index(),
        },
    ],
};
