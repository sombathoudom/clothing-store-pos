import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
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
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import { create, store } from '@/routes/returns';
import { show as showSale } from '@/routes/sales';

type Props = {
    sale: {
        id: number;
        invoice_no: string;
        customer_name: string | null;
        sold_at: string | null;
        items: Array<{
            id: number;
            product_name: string;
            category_name: string;
            size: string;
            qty: number;
            sell_price: string;
            already_returned_qty: number;
            available_to_return_qty: number;
        }>;
    };
};

export default function ReturnCreate({ sale }: Props) {
    const form = useForm({
        note: '',
        returned_at: new Date().toISOString().slice(0, 16),
        items: sale.items.map((item) => ({
            sale_item_id: item.id,
            qty: '',
        })),
    });

    return (
        <>
            <Head title={`Return ${sale.invoice_no}`} />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title={`Return for ${sale.invoice_no}`}
                    description="Restore stock based on original sale allocations and record the refund quantity safely."
                    action={
                        <Button variant="outline" asChild>
                            <Link href={showSale(sale.id)} prefetch>
                                Back to sale
                            </Link>
                        </Button>
                    }
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Sale context</CardTitle>
                        <CardDescription>
                            {sale.customer_name ?? 'Walk-in customer'} /{' '}
                            {formatDateTime(sale.sold_at)}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <form
                    className="flex flex-col gap-6"
                    onSubmit={(event) => {
                        event.preventDefault();

                        form.transform((data) => ({
                            ...data,
                            items: data.items
                                .filter(
                                    (item) =>
                                        item.qty !== '' && Number(item.qty) > 0,
                                )
                                .map((item) => ({
                                    sale_item_id: item.sale_item_id,
                                    qty: Number(item.qty),
                                })),
                        }));

                        form.post(store.url(sale.id), {
                            preserveScroll: true,
                        });
                    }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Return items</CardTitle>
                            <CardDescription>
                                Only return quantities that are still available
                                after prior returns.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {sale.items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
                                >
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
                                            Sold
                                        </p>
                                        <p className="font-medium">
                                            {formatNumber(item.qty)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Returned
                                        </p>
                                        <p className="font-medium">
                                            {formatNumber(
                                                item.already_returned_qty,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Available
                                        </p>
                                        <p className="font-medium">
                                            {formatNumber(
                                                item.available_to_return_qty,
                                            )}
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor={`qty-${item.id}`}>
                                            Return qty
                                        </Label>
                                        <Input
                                            id={`qty-${item.id}`}
                                            type="number"
                                            min={0}
                                            max={item.available_to_return_qty}
                                            value={form.data.items[index].qty}
                                            onChange={(event) =>
                                                form.setData(
                                                    'items',
                                                    form.data.items.map(
                                                        (entry, entryIndex) =>
                                                            entryIndex === index
                                                                ? {
                                                                      ...entry,
                                                                      qty: event
                                                                          .target
                                                                          .value,
                                                                  }
                                                                : entry,
                                                    ),
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="text-sm text-muted-foreground lg:col-span-5">
                                        Refund estimate:{' '}
                                        {formatCurrency(
                                            Number(item.sell_price) *
                                                Number(
                                                    form.data.items[index]
                                                        .qty || 0,
                                                ),
                                        )}
                                    </div>
                                </div>
                            ))}
                            <InputError message={form.errors.items} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Return details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="returned_at">Returned at</Label>
                                <Input
                                    id="returned_at"
                                    type="datetime-local"
                                    value={form.data.returned_at}
                                    onChange={(event) =>
                                        form.setData(
                                            'returned_at',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.returned_at} />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="note">Note</Label>
                                <Input
                                    id="note"
                                    value={form.data.note}
                                    onChange={(event) =>
                                        form.setData('note', event.target.value)
                                    }
                                    placeholder="Optional return note"
                                />
                                <InputError message={form.errors.note} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={showSale(sale.id)} prefetch>
                                Cancel
                            </Link>
                        </Button>
                        <Button disabled={form.processing}>
                            Create return
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ReturnCreate.layout = {
    breadcrumbs: [
        {
            title: 'Sales',
            href: showSale({ sale: 0 }),
        },
        {
            title: 'Create return',
            href: create({ sale: 0 }),
        },
    ],
};
