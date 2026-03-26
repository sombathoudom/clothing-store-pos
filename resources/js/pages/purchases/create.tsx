import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
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
import { create, index, store } from '@/routes/purchases';

type VariantOption = {
    id: string;
    size: string;
    stock: number;
};

type ProductOption = {
    id: string;
    name: string;
    category: string;
    image_url?: string | null;
    variants: VariantOption[];
};

type SizeEntry = {
    variant_id: string;
    qty: string;
    cost_price: string;
    suggested_sell_price: string;
};

type PurchaseLine = {
    product_id: string;
    sizes: Record<string, SizeEntry>;
};

type Props = {
    products: ProductOption[];
};

const allSizes = ['M', 'L', 'XL', '2XL', '3XL'] as const;

const emptyLine = (): PurchaseLine => ({
    product_id: '',
    sizes: Object.fromEntries(
        allSizes.map((size) => [
            size,
            {
                variant_id: '',
                qty: '',
                cost_price: '',
                suggested_sell_price: '',
            },
        ]),
    ) as Record<string, SizeEntry>,
});

export default function CreatePurchase({ products }: Props) {
    const form = useForm({
        reference_no: '',
        supplier_name: '',
        purchased_at: new Date().toISOString().slice(0, 16),
        note: '',
        items: [emptyLine()],
    });

    const updateLine = (index: number, productId: string) => {
        const product = products.find((entry) => entry.id === productId);

        form.setData(
            'items',
            form.data.items.map((line, lineIndex) => {
                if (lineIndex !== index) {
                    return line;
                }

                const nextLine = emptyLine();
                nextLine.product_id = productId;

                for (const variant of product?.variants ?? []) {
                    nextLine.sizes[variant.size].variant_id = variant.id;
                }

                return nextLine;
            }),
        );
    };

    const updateSizeEntry = (
        lineIndex: number,
        size: string,
        key: keyof SizeEntry,
        value: string,
    ) => {
        form.setData(
            'items',
            form.data.items.map((line, currentLineIndex) => {
                if (currentLineIndex !== lineIndex) {
                    return line;
                }

                return {
                    ...line,
                    sizes: {
                        ...line.sizes,
                        [size]: {
                            ...line.sizes[size],
                            [key]: value,
                        },
                    },
                };
            }),
        );
    };

    const addLine = () => {
        form.setData('items', [...form.data.items, emptyLine()]);
    };

    const availableProductsForLine = (lineIndex: number): ProductOption[] => {
        const selectedProductIds = new Set(
            form.data.items
                .map((line, index) =>
                    index === lineIndex ? null : line.product_id,
                )
                .filter(
                    (productId): productId is string =>
                        productId !== null && productId !== '',
                ),
        );

        return products.filter(
            (product) =>
                !selectedProductIds.has(product.id) ||
                product.id === form.data.items[lineIndex].product_id,
        );
    };

    const removeLine = (index: number) => {
        form.setData(
            'items',
            form.data.items.length === 1
                ? [emptyLine()]
                : form.data.items.filter((_, lineIndex) => lineIndex !== index),
        );
    };

    const copyValueToEnteredSizes = (
        lineIndex: number,
        key: 'cost_price' | 'suggested_sell_price',
        value: string,
    ) => {
        form.setData(
            'items',
            form.data.items.map((line, currentLineIndex) => {
                if (currentLineIndex !== lineIndex) {
                    return line;
                }

                return {
                    ...line,
                    sizes: Object.fromEntries(
                        allSizes.map((size) => {
                            const entry = line.sizes[size];

                            return [
                                size,
                                entry.variant_id !== ''
                                    ? {
                                          ...entry,
                                          [key]: value,
                                      }
                                    : entry,
                            ];
                        }),
                    ) as Record<string, SizeEntry>,
                };
            }),
        );
    };

    const overallQuantity = form.data.items.reduce(
        (total, line) =>
            total +
            allSizes.reduce(
                (lineTotal, size) =>
                    lineTotal + Number(line.sizes[size].qty || 0),
                0,
            ),
        0,
    );

    const overallEstimatedCost = form.data.items.reduce(
        (total, line) =>
            total +
            allSizes.reduce(
                (lineTotal, size) =>
                    lineTotal +
                    Number(line.sizes[size].qty || 0) *
                        Number(line.sizes[size].cost_price || 0),
                0,
            ),
        0,
    );

    return (
        <>
            <Head title="Create purchase" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Create purchase"
                    description="Add stock into the system as FIFO inventory batches with one purchase row per product and size-based inputs inside that row."
                />

                <form
                    className="flex flex-col gap-6"
                    onSubmit={(event) => {
                        event.preventDefault();

                        form.transform((data) => ({
                            ...data,
                            items: data.items.flatMap((line) =>
                                allSizes
                                    .map((size) => line.sizes[size])
                                    .filter(
                                        (entry) =>
                                            entry.variant_id !== '' &&
                                            entry.qty !== '' &&
                                            Number(entry.qty) > 0,
                                    )
                                    .map((entry) => ({
                                        product_variant_id: Number(
                                            entry.variant_id,
                                        ),
                                        qty: Number(entry.qty),
                                        cost_price: Number(entry.cost_price),
                                        suggested_sell_price:
                                            entry.suggested_sell_price === ''
                                                ? null
                                                : Number(
                                                      entry.suggested_sell_price,
                                                  ),
                                    })),
                            ),
                        }));

                        form.post(store.url(), {
                            preserveScroll: true,
                        });
                    }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Purchase details</CardTitle>
                            <CardDescription>
                                Record a header for this stock intake event
                                before entering line items.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="reference_no">
                                    Reference number
                                </Label>
                                <Input
                                    id="reference_no"
                                    value={form.data.reference_no}
                                    onChange={(event) =>
                                        form.setData(
                                            'reference_no',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="PO-20260326-01"
                                />
                                <InputError
                                    message={form.errors.reference_no}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="supplier_name">Supplier</Label>
                                <Input
                                    id="supplier_name"
                                    value={form.data.supplier_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'supplier_name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Supplier name"
                                />
                                <InputError
                                    message={form.errors.supplier_name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="purchased_at">
                                    Purchased at
                                </Label>
                                <Input
                                    id="purchased_at"
                                    type="datetime-local"
                                    value={form.data.purchased_at}
                                    onChange={(event) =>
                                        form.setData(
                                            'purchased_at',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.purchased_at}
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
                                    placeholder="Optional note"
                                />
                                <InputError message={form.errors.note} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <CardTitle>Purchase items</CardTitle>
                                    <CardDescription>
                                        One row represents one product. Fill
                                        only the sizes you are actually
                                        purchasing.
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addLine}
                                >
                                    <Plus data-icon="inline-start" />
                                    Add product row
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-6">
                            {form.data.items.map((line, lineIndex) => {
                                const product = products.find(
                                    (entry) => entry.id === line.product_id,
                                );
                                const availableProducts =
                                    availableProductsForLine(lineIndex);
                                const totalUnits = allSizes.reduce(
                                    (total, size) =>
                                        total +
                                        Number(line.sizes[size].qty || 0),
                                    0,
                                );
                                const estimatedCost = allSizes.reduce(
                                    (total, size) =>
                                        total +
                                        Number(line.sizes[size].qty || 0) *
                                            Number(
                                                line.sizes[size].cost_price ||
                                                    0,
                                            ),
                                    0,
                                );

                                return (
                                    <div
                                        key={lineIndex}
                                        className="rounded-lg border p-4"
                                    >
                                        <div className="mb-4 flex items-start justify-between gap-4">
                                            <div className="grid w-full gap-2 lg:max-w-sm">
                                                <Label>Product</Label>
                                                <Select
                                                    value={line.product_id}
                                                    onValueChange={(value) =>
                                                        updateLine(
                                                            lineIndex,
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select a product" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {availableProducts.map(
                                                                (
                                                                    productOption,
                                                                ) => (
                                                                    <SelectItem
                                                                        key={
                                                                            productOption.id
                                                                        }
                                                                        value={
                                                                            productOption.id
                                                                        }
                                                                    >
                                                                        <span className="flex items-center gap-3">
                                                                            {productOption.image_url ? (
                                                                                <img
                                                                                    src={
                                                                                        productOption.image_url
                                                                                    }
                                                                                    alt={
                                                                                        productOption.name
                                                                                    }
                                                                                    className="size-8 rounded-md object-cover"
                                                                                />
                                                                            ) : (
                                                                                <span className="flex size-8 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
                                                                                    IMG
                                                                                </span>
                                                                            )}
                                                                            <span className="flex flex-col gap-0.5">
                                                                                <span>
                                                                                    {
                                                                                        productOption.name
                                                                                    }
                                                                                </span>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {
                                                                                        productOption.category
                                                                                    }
                                                                                </span>
                                                                            </span>
                                                                        </span>
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground">
                                                    {product?.category ??
                                                        'Choose a product first'}
                                                </p>
                                                {product ? (
                                                    <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                                                        {product.image_url ? (
                                                            <img
                                                                src={
                                                                    product.image_url
                                                                }
                                                                alt={
                                                                    product.name
                                                                }
                                                                className="size-12 rounded-md object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex size-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                                                                No image
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {product.name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {
                                                                    product.category
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="rounded-lg border bg-muted/30 px-4 py-3 text-right">
                                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                                        Total qty
                                                    </p>
                                                    <p className="text-lg font-semibold">
                                                        {totalUnits}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Est. cost{' '}
                                                        {estimatedCost.toFixed(
                                                            2,
                                                        )}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() =>
                                                        removeLine(lineIndex)
                                                    }
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                                            {allSizes.map((size) => {
                                                const sizeEntry =
                                                    line.sizes[size];
                                                const variant =
                                                    product?.variants.find(
                                                        (entry) =>
                                                            entry.size === size,
                                                    );
                                                const disabled =
                                                    variant === undefined;

                                                return (
                                                    <div
                                                        key={size}
                                                        className="rounded-lg border bg-muted/20 p-4"
                                                    >
                                                        <div className="mb-3 flex items-center justify-between gap-2">
                                                            <h3 className="font-medium">
                                                                {size}
                                                            </h3>
                                                            <span className="text-xs text-muted-foreground">
                                                                {variant
                                                                    ? `Stock ${variant.stock}`
                                                                    : 'Not available'}
                                                            </span>
                                                        </div>

                                                        <div className="grid gap-3">
                                                            <div className="grid gap-2">
                                                                <Label
                                                                    htmlFor={`qty-${lineIndex}-${size}`}
                                                                >
                                                                    Qty
                                                                </Label>
                                                                <Input
                                                                    id={`qty-${lineIndex}-${size}`}
                                                                    type="number"
                                                                    min={0}
                                                                    value={
                                                                        sizeEntry.qty
                                                                    }
                                                                    disabled={
                                                                        disabled
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateSizeEntry(
                                                                            lineIndex,
                                                                            size,
                                                                            'qty',
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label
                                                                    htmlFor={`cost-${lineIndex}-${size}`}
                                                                >
                                                                    Cost
                                                                </Label>
                                                                <Input
                                                                    id={`cost-${lineIndex}-${size}`}
                                                                    type="number"
                                                                    min={0}
                                                                    step="0.0001"
                                                                    value={
                                                                        sizeEntry.cost_price
                                                                    }
                                                                    disabled={
                                                                        disabled
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateSizeEntry(
                                                                            lineIndex,
                                                                            size,
                                                                            'cost_price',
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label
                                                                    htmlFor={`sell-${lineIndex}-${size}`}
                                                                >
                                                                    Suggested
                                                                    sell
                                                                </Label>
                                                                <Input
                                                                    id={`sell-${lineIndex}-${size}`}
                                                                    type="number"
                                                                    min={0}
                                                                    step="0.0001"
                                                                    value={
                                                                        sizeEntry.suggested_sell_price
                                                                    }
                                                                    disabled={
                                                                        disabled
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateSizeEntry(
                                                                            lineIndex,
                                                                            size,
                                                                            'suggested_sell_price',
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3">
                                            <div className="text-sm text-muted-foreground">
                                                Fast actions for this product
                                                row
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={
                                                        line.product_id === ''
                                                    }
                                                    onClick={() => {
                                                        const firstFilledCost =
                                                            allSizes
                                                                .map(
                                                                    (size) =>
                                                                        line
                                                                            .sizes[
                                                                            size
                                                                        ]
                                                                            .cost_price,
                                                                )
                                                                .find(
                                                                    (value) =>
                                                                        value !==
                                                                        '',
                                                                );

                                                        if (
                                                            firstFilledCost !==
                                                            undefined
                                                        ) {
                                                            copyValueToEnteredSizes(
                                                                lineIndex,
                                                                'cost_price',
                                                                firstFilledCost,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    Copy cost to all sizes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={
                                                        line.product_id === ''
                                                    }
                                                    onClick={() => {
                                                        const firstFilledSell =
                                                            allSizes
                                                                .map(
                                                                    (size) =>
                                                                        line
                                                                            .sizes[
                                                                            size
                                                                        ]
                                                                            .suggested_sell_price,
                                                                )
                                                                .find(
                                                                    (value) =>
                                                                        value !==
                                                                        '',
                                                                );

                                                        if (
                                                            firstFilledSell !==
                                                            undefined
                                                        ) {
                                                            copyValueToEnteredSizes(
                                                                lineIndex,
                                                                'suggested_sell_price',
                                                                firstFilledSell,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    Copy sell to all sizes
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <InputError message={form.errors.items} />
                        </CardContent>
                    </Card>

                    <Card className="sticky bottom-4 z-10 border-primary/20 shadow-sm">
                        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap gap-6">
                                <div>
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Product rows
                                    </p>
                                    <p className="text-2xl font-semibold">
                                        {
                                            form.data.items.filter(
                                                (line) =>
                                                    line.product_id !== '',
                                            ).length
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Total qty
                                    </p>
                                    <p className="text-2xl font-semibold">
                                        {overallQuantity}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Estimated cost
                                    </p>
                                    <p className="text-2xl font-semibold">
                                        {overallEstimatedCost.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" asChild>
                                    <Link href={index()} prefetch>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button disabled={form.processing}>
                                    Create purchase
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </>
    );
}

CreatePurchase.layout = {
    breadcrumbs: [
        {
            title: 'Purchases',
            href: index(),
        },
        {
            title: 'Create purchase',
            href: create(),
        },
    ],
};
