import { Head, useForm } from '@inertiajs/react';
import {
    ChevronRight,
    CreditCard,
    Search,
    ShoppingCart,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatNumber } from '@/lib/format';
import { checkout, index } from '@/routes/pos';

type Variant = {
    id: number;
    product_name: string;
    image_url: string | null;
    category_id: string;
    category_name: string;
    size: string;
    sku: string | null;
    current_stock: number;
    suggested_sell_price: string | null;
};

type ProductGroup = {
    id: string;
    product_name: string;
    image_url: string | null;
    category_id: string;
    category_name: string;
    total_stock: number;
    variants: Variant[];
};

type CartItem = {
    product_variant_id: number;
    product_name: string;
    image_url: string | null;
    size: string;
    current_stock: number;
    qty: number;
    sell_price: string;
};

type Props = {
    filters: {
        search: string;
        category_id: string;
    };
    categories: Array<{
        id: string;
        name: string;
    }>;
    variants: Variant[];
    invoicePreview: string;
    rielExchangeRate: string;
};

export default function PosIndex({
    filters,
    categories,
    variants,
    invoicePreview,
    rielExchangeRate,
}: Props) {
    const [cartOpen, setCartOpen] = useState(false);

    const form = useForm<{
        customer_name: string;
        customer_phone: string;
        customer_address: string;
        discount: string;
        items: Array<{
            product_variant_id: number;
            qty: number;
            sell_price: number;
        }>;
    }>({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        discount: '0',
        items: [],
    });

    const searchForm = useForm({
        search: filters.search,
        category_id: filters.category_id === '' ? 'all' : filters.category_id,
    });

    const productGroups = useMemo<ProductGroup[]>(() => {
        const grouped = new Map<string, ProductGroup>();

        for (const variant of variants) {
            const key = `${variant.product_name}-${variant.category_id}`;

            if (!grouped.has(key)) {
                grouped.set(key, {
                    id: key,
                    product_name: variant.product_name,
                    image_url: variant.image_url,
                    category_id: variant.category_id,
                    category_name: variant.category_name,
                    total_stock: 0,
                    variants: [],
                });
            }

            const product = grouped.get(key)!;
            product.variants.push(variant);
            product.total_stock += variant.current_stock;
        }

        return Array.from(grouped.values());
    }, [variants]);

    const cartItems: CartItem[] = useMemo(
        () =>
            form.data.items
                .map((item) => {
                    const variant = variants.find(
                        (entry) => entry.id === item.product_variant_id,
                    );

                    if (!variant) {
                        return null;
                    }

                    return {
                        product_variant_id: item.product_variant_id,
                        product_name: variant.product_name,
                        image_url: variant.image_url,
                        size: variant.size,
                        current_stock: variant.current_stock,
                        qty: item.qty,
                        sell_price: item.sell_price.toString(),
                    };
                })
                .filter((item): item is CartItem => item !== null),
        [form.data.items, variants],
    );

    const subtotal = cartItems.reduce(
        (total, item) => total + item.qty * Number(item.sell_price),
        0,
    );
    const totalItems = cartItems.reduce((total, item) => total + item.qty, 0);
    const discount = Number(form.data.discount || 0);
    const finalAmount = Math.max(subtotal - discount, 0);

    const addToCart = (variant: Variant) => {
        const existingItem = form.data.items.find(
            (item) => item.product_variant_id === variant.id,
        );

        if (existingItem) {
            form.setData(
                'items',
                form.data.items.map((item) =>
                    item.product_variant_id === variant.id
                        ? {
                              ...item,
                              qty: Math.min(
                                  item.qty + 1,
                                  variant.current_stock,
                              ),
                          }
                        : item,
                ),
            );
        } else {
            form.setData('items', [
                ...form.data.items,
                {
                    product_variant_id: variant.id,
                    qty: 1,
                    sell_price: Number(variant.suggested_sell_price ?? 0),
                },
            ]);
        }

        setCartOpen(true);
    };

    const updateCartItem = (
        productVariantId: number,
        key: 'qty' | 'sell_price',
        value: number,
    ) => {
        form.setData(
            'items',
            form.data.items.map((item) =>
                item.product_variant_id === productVariantId
                    ? { ...item, [key]: value }
                    : item,
            ),
        );
    };

    const removeCartItem = (productVariantId: number) => {
        form.setData(
            'items',
            form.data.items.filter(
                (item) => item.product_variant_id !== productVariantId,
            ),
        );
    };

    const submitSearch = () => {
        searchForm.get(
            index.url({
                query: {
                    search: searchForm.data.search || undefined,
                    category_id:
                        searchForm.data.category_id === 'all'
                            ? undefined
                            : searchForm.data.category_id,
                },
            }),
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title="POS" />

            <div className="relative flex flex-col gap-4 bg-[radial-gradient(circle_at_top_left,_rgba(0,0,0,0.03),_transparent_35%),linear-gradient(to_bottom,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] p-3 md:gap-6 md:p-4">
                <PageHeader
                    title="POS checkout"
                    description="Mobile-first checkout built for dense catalogs, quick size picking, and always-visible cart totals."
                />

                <div className="sticky top-3 z-20 flex flex-col gap-3 rounded-2xl border bg-background/95 p-3 shadow-sm backdrop-blur md:top-4 md:p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="h-11 rounded-xl pl-10"
                                value={searchForm.data.search}
                                onChange={(event) =>
                                    searchForm.setData(
                                        'search',
                                        event.target.value,
                                    )
                                }
                                placeholder="Search product name"
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <div className="flex min-w-max gap-2 md:hidden">
                                <Button
                                    type="button"
                                    variant={
                                        searchForm.data.category_id === 'all'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() =>
                                        searchForm.setData('category_id', 'all')
                                    }
                                >
                                    All
                                </Button>
                                {categories.map((category) => (
                                    <Button
                                        key={category.id}
                                        type="button"
                                        variant={
                                            searchForm.data.category_id ===
                                            category.id
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        className="rounded-full"
                                        onClick={() =>
                                            searchForm.setData(
                                                'category_id',
                                                category.id,
                                            )
                                        }
                                    >
                                        {category.name}
                                    </Button>
                                ))}
                            </div>
                            <div className="hidden md:block">
                                <Select
                                    value={searchForm.data.category_id}
                                    onValueChange={(value) =>
                                        searchForm.setData('category_id', value)
                                    }
                                >
                                    <SelectTrigger className="h-11 w-full rounded-xl">
                                        <SelectValue placeholder="All categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">
                                                All categories
                                            </SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                className="h-11 flex-1 rounded-xl md:flex-none"
                                onClick={submitSearch}
                            >
                                Filter
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-xl"
                                onClick={() => {
                                    searchForm.setData({
                                        search: '',
                                        category_id: 'all',
                                    });
                                    searchForm.get(index.url(), {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/30 p-3">
                        <div>
                            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                                Invoice
                            </p>
                            <p className="font-semibold">{invoicePreview}</p>
                        </div>
                        <div>
                            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                                Cart qty
                            </p>
                            <p className="font-semibold">
                                {formatNumber(totalItems)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                                Total
                            </p>
                            <p className="font-semibold">
                                {formatCurrency(finalAmount)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.7fr_0.95fr]">
                    <div className="flex flex-col gap-3 pb-28 xl:pb-0">
                        {productGroups.map((product) => (
                            <Card
                                key={product.id}
                                className="overflow-hidden rounded-2xl border-border/70"
                            >
                                <CardContent className="p-4 md:p-5">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="flex items-start gap-4">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.product_name}
                                                    className="size-18 rounded-2xl object-cover md:size-20"
                                                />
                                            ) : (
                                                <div className="flex size-18 items-center justify-center rounded-2xl bg-muted text-xs text-muted-foreground md:size-20">
                                                    No image
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-2">
                                                <div>
                                                    <p className="text-lg leading-tight font-semibold">
                                                        {product.product_name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {product.category_name}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="secondary">
                                                        {formatNumber(
                                                            product.total_stock,
                                                        )}{' '}
                                                        in stock
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {
                                                            product.variants
                                                                .length
                                                        }{' '}
                                                        sizes
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border bg-muted/20 px-4 py-3 text-right">
                                            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                                                Fast add
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Tap a size below
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {product.variants.map((variant) => {
                                            const inCart = cartItems.find(
                                                (item) =>
                                                    item.product_variant_id ===
                                                    variant.id,
                                            );

                                            return (
                                                <button
                                                    key={variant.id}
                                                    type="button"
                                                    disabled={
                                                        variant.current_stock ===
                                                        0
                                                    }
                                                    onClick={() =>
                                                        addToCart(variant)
                                                    }
                                                    className="group rounded-2xl border bg-background p-4 text-left transition hover:border-primary/40 hover:bg-primary/3 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-base font-semibold">
                                                                Size{' '}
                                                                {variant.size}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {variant.sku ??
                                                                    'No SKU'}
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            variant={
                                                                variant.current_stock >
                                                                0
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {variant.current_stock >
                                                            0
                                                                ? formatNumber(
                                                                      variant.current_stock,
                                                                  )
                                                                : '0'}
                                                        </Badge>
                                                    </div>

                                                    <div className="mt-4 flex items-end justify-between gap-4">
                                                        <div>
                                                            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                                                                Price
                                                            </p>
                                                            <p className="text-lg font-semibold">
                                                                {variant.suggested_sell_price ===
                                                                null
                                                                    ? '-'
                                                                    : formatCurrency(
                                                                          variant.suggested_sell_price,
                                                                      )}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            {inCart ? (
                                                                <Badge variant="outline">
                                                                    In cart x
                                                                    {inCart.qty}
                                                                </Badge>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                                                                    Add
                                                                    <ChevronRight className="size-4" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="hidden xl:block">
                        <div className="sticky top-4">
                            <PosCartPanel
                                invoicePreview={invoicePreview}
                                rielExchangeRate={rielExchangeRate}
                                cartItems={cartItems}
                                subtotal={subtotal}
                                finalAmount={finalAmount}
                                form={form}
                                onRemove={removeCartItem}
                                onUpdate={updateCartItem}
                            />
                        </div>
                    </div>
                </div>

                <div className="xl:hidden">
                    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/96 p-3 shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
                        <button
                            type="button"
                            onClick={() => setCartOpen((value) => !value)}
                            className="flex w-full items-center justify-between rounded-2xl border bg-muted/30 px-4 py-3 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                                    <ShoppingCart className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">
                                        Cart ({formatNumber(totalItems)})
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatCurrency(finalAmount)} /{' '}
                                        {formatNumber(
                                            finalAmount *
                                                Number(rielExchangeRate),
                                        )}{' '}
                                        Riel
                                    </p>
                                </div>
                            </div>
                            <Badge variant="secondary">
                                {cartOpen ? 'Hide' : 'Open'}
                            </Badge>
                        </button>

                        {cartOpen ? (
                            <div className="mt-3 max-h-[76vh] overflow-y-auto rounded-2xl border bg-background p-3">
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="font-semibold">
                                        Checkout cart
                                    </h2>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setCartOpen(false)}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                                <PosCartPanel
                                    invoicePreview={invoicePreview}
                                    rielExchangeRate={rielExchangeRate}
                                    cartItems={cartItems}
                                    subtotal={subtotal}
                                    finalAmount={finalAmount}
                                    form={form}
                                    onRemove={removeCartItem}
                                    onUpdate={updateCartItem}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}

type PosCartPanelProps = {
    invoicePreview: string;
    rielExchangeRate: string;
    cartItems: CartItem[];
    subtotal: number;
    finalAmount: number;
    form: ReturnType<
        typeof useForm<{
            customer_name: string;
            customer_phone: string;
            customer_address: string;
            discount: string;
            items: Array<{
                product_variant_id: number;
                qty: number;
                sell_price: number;
            }>;
        }>
    >;
    onRemove: (productVariantId: number) => void;
    onUpdate: (
        productVariantId: number,
        key: 'qty' | 'sell_price',
        value: number,
    ) => void;
};

function PosCartPanel({
    invoicePreview,
    rielExchangeRate,
    cartItems,
    subtotal,
    finalAmount,
    form,
    onRemove,
    onUpdate,
}: PosCartPanelProps) {
    return (
        <Card className="overflow-hidden rounded-3xl border-border/70">
            <CardHeader className="border-b bg-muted/20">
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="size-5" />
                    Checkout cart
                </CardTitle>
                <CardDescription>
                    Invoice {invoicePreview} / 1 USD ={' '}
                    {formatNumber(rielExchangeRate)} Riel
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-5 p-4 md:p-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                    <div className="grid gap-2">
                        <Label htmlFor="customer_name">Customer name</Label>
                        <Input
                            id="customer_name"
                            value={form.data.customer_name}
                            onChange={(event) =>
                                form.setData(
                                    'customer_name',
                                    event.target.value,
                                )
                            }
                            placeholder="Walk-in or customer name"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="customer_phone">Customer phone</Label>
                        <Input
                            id="customer_phone"
                            value={form.data.customer_phone}
                            onChange={(event) =>
                                form.setData(
                                    'customer_phone',
                                    event.target.value,
                                )
                            }
                            placeholder="Optional"
                        />
                    </div>
                    <div className="grid gap-2 md:col-span-2 xl:col-span-1">
                        <Label htmlFor="customer_address">
                            Customer address
                        </Label>
                        <Input
                            id="customer_address"
                            value={form.data.customer_address}
                            onChange={(event) =>
                                form.setData(
                                    'customer_address',
                                    event.target.value,
                                )
                            }
                            placeholder="Optional"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {cartItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                            Tap a size card to add it here.
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div
                                key={item.product_variant_id}
                                className="rounded-2xl border bg-muted/10 p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.product_name}
                                                className="size-14 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-14 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">
                                                No image
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {item.product_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Size {item.size} / Stock{' '}
                                                {formatNumber(
                                                    item.current_stock,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            onRemove(item.product_variant_id)
                                        }
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Qty</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={item.current_stock}
                                            value={item.qty}
                                            onChange={(event) =>
                                                onUpdate(
                                                    item.product_variant_id,
                                                    'qty',
                                                    Number(event.target.value),
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Sell price</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step="0.0001"
                                            value={item.sell_price}
                                            onChange={(event) =>
                                                onUpdate(
                                                    item.product_variant_id,
                                                    'sell_price',
                                                    Number(event.target.value),
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    <InputError message={form.errors.items} />
                </div>

                <div className="grid gap-3 rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">
                            Subtotal
                        </span>
                        <span className="font-medium">
                            {formatCurrency(subtotal)}
                        </span>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="discount">Discount</Label>
                        <Input
                            id="discount"
                            type="number"
                            min={0}
                            step="0.01"
                            value={form.data.discount}
                            onChange={(event) =>
                                form.setData('discount', event.target.value)
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t pt-3">
                        <span className="text-sm text-muted-foreground">
                            Final total
                        </span>
                        <div className="text-right">
                            <p className="text-lg font-semibold">
                                {formatCurrency(finalAmount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatNumber(
                                    finalAmount * Number(rielExchangeRate),
                                )}{' '}
                                Riel
                            </p>
                        </div>
                    </div>
                </div>

                <Button
                    size="lg"
                    className="h-12 rounded-2xl"
                    disabled={form.processing || cartItems.length === 0}
                    onClick={() =>
                        form.post(checkout.url(), {
                            preserveScroll: true,
                        })
                    }
                >
                    Complete checkout
                </Button>
            </CardContent>
        </Card>
    );
}

PosIndex.layout = {
    breadcrumbs: [
        {
            title: 'POS',
            href: index(),
        },
    ],
};
