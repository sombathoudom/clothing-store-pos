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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import { create, store } from '@/routes/exchanges';
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
            already_exchanged_qty: number;
            available_to_exchange_qty: number;
        }>;
    };
    variants: Array<{
        id: string;
        label: string;
        category: string;
        current_stock: number;
        suggested_sell_price: string | null;
    }>;
};

export default function ExchangeCreate({ sale, variants }: Props) {
    const form = useForm({
        note: '',
        exchanged_at: new Date().toISOString().slice(0, 16),
        items: sale.items.map(() => ({
            sale_item_id: 0,
            replacement_product_variant_id: '',
            qty: '',
            new_unit_price: '',
        })),
    });

    return (
        <>
            <Head title={`Exchange ${sale.invoice_no}`} />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title={`Exchange for ${sale.invoice_no}`}
                    description="Return the original sold quantity and issue a replacement variant using FIFO stock from the replacement item."
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
                                        item.qty !== '' &&
                                        Number(item.qty) > 0 &&
                                        item.replacement_product_variant_id !==
                                            '',
                                )
                                .map((item, index) => ({
                                    sale_item_id: sale.items[index].id,
                                    replacement_product_variant_id: Number(
                                        item.replacement_product_variant_id,
                                    ),
                                    qty: Number(item.qty),
                                    new_unit_price: Number(item.new_unit_price),
                                })),
                        }));

                        form.post(store.url(sale.id), {
                            preserveScroll: true,
                        });
                    }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Exchange items</CardTitle>
                            <CardDescription>
                                Choose a replacement variant, set the exchange
                                quantity, and review the price difference.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {sale.items.map((item, index) => {
                                const replacement = variants.find(
                                    (variant) =>
                                        variant.id ===
                                        form.data.items[index]
                                            .replacement_product_variant_id,
                                );
                                const difference =
                                    (Number(
                                        form.data.items[index].new_unit_price ||
                                            0,
                                    ) -
                                        Number(item.sell_price)) *
                                    Number(form.data.items[index].qty || 0);

                                return (
                                    <div
                                        key={item.id}
                                        className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[2fr_1fr_1fr_2fr_1fr_1fr]"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {item.product_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.category_name} /{' '}
                                                {item.size}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                                Available
                                            </p>
                                            <p className="font-medium">
                                                {formatNumber(
                                                    item.available_to_exchange_qty,
                                                )}
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor={`qty-${item.id}`}>
                                                Qty
                                            </Label>
                                            <Input
                                                id={`qty-${item.id}`}
                                                type="number"
                                                min={0}
                                                max={
                                                    item.available_to_exchange_qty
                                                }
                                                value={
                                                    form.data.items[index].qty
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'items',
                                                        form.data.items.map(
                                                            (
                                                                entry,
                                                                entryIndex,
                                                            ) =>
                                                                entryIndex ===
                                                                index
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
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor={`replacement-${item.id}`}
                                            >
                                                Replacement
                                            </Label>
                                            <Select
                                                value={
                                                    form.data.items[index]
                                                        .replacement_product_variant_id
                                                }
                                                onValueChange={(value) => {
                                                    const suggestion =
                                                        variants.find(
                                                            (variant) =>
                                                                variant.id ===
                                                                value,
                                                        )
                                                            ?.suggested_sell_price ??
                                                        '';

                                                    form.setData(
                                                        'items',
                                                        form.data.items.map(
                                                            (
                                                                entry,
                                                                entryIndex,
                                                            ) =>
                                                                entryIndex ===
                                                                index
                                                                    ? {
                                                                          ...entry,
                                                                          replacement_product_variant_id:
                                                                              value,
                                                                          new_unit_price:
                                                                              suggestion ===
                                                                              null
                                                                                  ? ''
                                                                                  : String(
                                                                                        suggestion,
                                                                                    ),
                                                                      }
                                                                    : entry,
                                                        ),
                                                    );
                                                }}
                                            >
                                                <SelectTrigger
                                                    id={`replacement-${item.id}`}
                                                >
                                                    <SelectValue placeholder="Select variant" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {variants.map(
                                                            (variant) => (
                                                                <SelectItem
                                                                    key={
                                                                        variant.id
                                                                    }
                                                                    value={
                                                                        variant.id
                                                                    }
                                                                >
                                                                    {
                                                                        variant.label
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                {replacement
                                                    ? `${replacement.category} / Stock ${formatNumber(replacement.current_stock)}`
                                                    : 'Choose a replacement'}
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor={`price-${item.id}`}>
                                                New price
                                            </Label>
                                            <Input
                                                id={`price-${item.id}`}
                                                type="number"
                                                min={0}
                                                step="0.0001"
                                                value={
                                                    form.data.items[index]
                                                        .new_unit_price
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'items',
                                                        form.data.items.map(
                                                            (
                                                                entry,
                                                                entryIndex,
                                                            ) =>
                                                                entryIndex ===
                                                                index
                                                                    ? {
                                                                          ...entry,
                                                                          new_unit_price:
                                                                              event
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : entry,
                                                        ),
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                                Difference
                                            </p>
                                            <p className="font-medium">
                                                {formatCurrency(difference)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <InputError message={form.errors.items} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Exchange details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="exchanged_at">
                                    Exchanged at
                                </Label>
                                <Input
                                    id="exchanged_at"
                                    type="datetime-local"
                                    value={form.data.exchanged_at}
                                    onChange={(event) =>
                                        form.setData(
                                            'exchanged_at',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.exchanged_at}
                                />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="note">Note</Label>
                                <Input
                                    id="note"
                                    value={form.data.note}
                                    onChange={(event) =>
                                        form.setData('note', event.target.value)
                                    }
                                    placeholder="Optional exchange note"
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
                            Create exchange
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ExchangeCreate.layout = {
    breadcrumbs: [
        {
            title: 'Sales',
            href: showSale({ sale: 0 }),
        },
        {
            title: 'Create exchange',
            href: create({ sale: 0 }),
        },
    ],
};
