import { Head, useForm } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import type { PaginatedData } from '@/components/data-table';
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
import { formatDateTime, formatNumber } from '@/lib/format';
import { index, store } from '@/routes/adjustments';

type AdjustmentRow = {
    id: number;
    product_name: string;
    category_name: string;
    size: string;
    type: string;
    reason: string;
    qty: number;
    note: string | null;
    performed_at: string | null;
};

type Props = {
    adjustments: PaginatedData<AdjustmentRow>;
    variants: Array<{
        id: string;
        label: string;
        category: string;
        current_stock: number;
    }>;
    types: string[];
    reasons: string[];
};

const columnHelper = createColumnHelper<AdjustmentRow>();

const columns = [
    columnHelper.accessor('product_name', {
        header: 'Variant',
        cell: ({ row, getValue }) => (
            <div className="flex flex-col gap-1">
                <span className="font-medium">{getValue()}</span>
                <span className="text-sm text-muted-foreground">
                    {row.original.category_name} / {row.original.size}
                </span>
            </div>
        ),
    }),
    columnHelper.accessor('type', {
        header: 'Type',
        cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
    }),
    columnHelper.accessor('reason', {
        header: 'Reason',
        cell: ({ getValue }) => getValue(),
    }),
    columnHelper.accessor('qty', {
        header: 'Qty',
        cell: ({ getValue }) => formatNumber(getValue()),
    }),
    columnHelper.accessor('performed_at', {
        header: 'Performed',
        cell: ({ getValue }) => formatDateTime(getValue()),
    }),
] as never[];

export default function AdjustmentsIndex({
    adjustments,
    variants,
    types,
    reasons,
}: Props) {
    const form = useForm({
        product_variant_id: variants[0]?.id ?? '',
        type: types[0] ?? 'add',
        reason: reasons[0] ?? 'count_correction',
        qty: '1',
        note: '',
        performed_at: new Date().toISOString().slice(0, 16),
    });

    return (
        <>
            <Head title="Stock adjustments" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Stock adjustments"
                    description="Apply audited manual stock corrections while preserving FIFO stock integrity."
                />

                <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>New adjustment</CardTitle>
                            <CardDescription>
                                Add stock for a manual restock or remove stock
                                using FIFO from the oldest remaining batches.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="flex flex-col gap-4"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    form.transform((data) => ({
                                        ...data,
                                        qty: Number(data.qty),
                                    }));

                                    form.post(store.url(), {
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="product_variant_id">
                                        Variant
                                    </Label>
                                    <Select
                                        value={form.data.product_variant_id}
                                        onValueChange={(value) =>
                                            form.setData(
                                                'product_variant_id',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger id="product_variant_id">
                                            <SelectValue placeholder="Select a variant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {variants.map((variant) => (
                                                    <SelectItem
                                                        key={variant.id}
                                                        value={variant.id}
                                                    >
                                                        {variant.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Current stock:{' '}
                                        {formatNumber(
                                            Number(
                                                variants.find(
                                                    (variant) =>
                                                        variant.id ===
                                                        form.data
                                                            .product_variant_id,
                                                )?.current_stock ?? 0,
                                            ),
                                        )}
                                    </p>
                                    <InputError
                                        message={form.errors.product_variant_id}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select
                                            value={form.data.type}
                                            onValueChange={(value) =>
                                                form.setData('type', value)
                                            }
                                        >
                                            <SelectTrigger id="type">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {types.map((type) => (
                                                        <SelectItem
                                                            key={type}
                                                            value={type}
                                                        >
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={form.errors.type}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="reason">Reason</Label>
                                        <Select
                                            value={form.data.reason}
                                            onValueChange={(value) =>
                                                form.setData('reason', value)
                                            }
                                        >
                                            <SelectTrigger id="reason">
                                                <SelectValue placeholder="Select reason" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {reasons.map((reason) => (
                                                        <SelectItem
                                                            key={reason}
                                                            value={reason}
                                                        >
                                                            {reason}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={form.errors.reason}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="qty">Quantity</Label>
                                        <Input
                                            id="qty"
                                            type="number"
                                            min={1}
                                            value={form.data.qty}
                                            onChange={(event) =>
                                                form.setData(
                                                    'qty',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError message={form.errors.qty} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="performed_at">
                                            Performed at
                                        </Label>
                                        <Input
                                            id="performed_at"
                                            type="datetime-local"
                                            value={form.data.performed_at}
                                            onChange={(event) =>
                                                form.setData(
                                                    'performed_at',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={form.errors.performed_at}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="note">Note</Label>
                                    <Input
                                        id="note"
                                        value={form.data.note}
                                        onChange={(event) =>
                                            form.setData(
                                                'note',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Optional context for the adjustment"
                                    />
                                    <InputError message={form.errors.note} />
                                </div>

                                <Button disabled={form.processing}>
                                    Save adjustment
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Adjustment history</CardTitle>
                            <CardDescription>
                                Review every manual stock correction applied to
                                the inventory ledger.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={columns}
                                data={adjustments}
                                emptyMessage="No adjustments recorded yet."
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AdjustmentsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Adjustments',
            href: index(),
        },
    ],
};
