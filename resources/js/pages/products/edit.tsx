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
import { Checkbox } from '@/components/ui/checkbox';
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
import { edit as editRoute, index, update } from '@/routes/products';

type Props = {
    product: {
        id: number;
        name: string;
        image_url: string | null;
        category_id: string;
        is_active: boolean;
        sizes: string[];
    };
    categories: Array<{
        id: string;
        name: string;
    }>;
    sizes: string[];
};

export default function EditProduct({ product, categories, sizes }: Props) {
    const form = useForm({
        category_id: product.category_id,
        name: product.name,
        image: null as File | null,
        is_active: product.is_active,
        sizes: product.sizes,
    });

    const toggleSize = (size: string, checked: boolean) => {
        form.setData(
            'sizes',
            checked
                ? [...form.data.sizes, size]
                : form.data.sizes.filter((value) => value !== size),
        );
    };

    return (
        <>
            <Head title={`Edit ${product.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title={`Edit ${product.name}`}
                    description="Adjust product details and synchronize the size variants available for stock and sales."
                />

                <form
                    className="flex flex-col gap-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.put(update.url(product.id), {
                            preserveScroll: true,
                        });
                    }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Product details</CardTitle>
                            <CardDescription>
                                Keep the catalog clean while preserving
                                historical product records.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="category_id">Category</Label>
                                <Select
                                    value={form.data.category_id}
                                    onValueChange={(value) =>
                                        form.setData('category_id', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="category_id"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
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
                                <InputError message={form.errors.category_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Product name</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="image">Product image</Label>
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="h-36 w-full max-w-56 rounded-lg object-cover"
                                    />
                                ) : null}
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        form.setData(
                                            'image',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                <InputError message={form.errors.image} />
                            </div>

                            <label className="flex items-start gap-3 rounded-lg border p-4 md:col-span-2">
                                <Checkbox
                                    checked={form.data.is_active}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'is_active',
                                            checked === true,
                                        )
                                    }
                                />
                                <span className="flex flex-col gap-1">
                                    <span className="font-medium">
                                        Active product
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Inactive products remain traceable in
                                        history while disappearing from new
                                        operational flows.
                                    </span>
                                </span>
                            </label>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Size variants</CardTitle>
                            <CardDescription>
                                Adding a size creates a new sellable variant.
                                Removing a size deletes that variant row.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                            {sizes.map((size) => (
                                <label
                                    key={size}
                                    className="flex items-start gap-3 rounded-lg border p-4"
                                >
                                    <Checkbox
                                        checked={form.data.sizes.includes(size)}
                                        onCheckedChange={(checked) =>
                                            toggleSize(size, checked === true)
                                        }
                                    />
                                    <span className="font-medium">{size}</span>
                                </label>
                            ))}
                            <InputError message={form.errors.sizes} />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={index()} prefetch>
                                Cancel
                            </Link>
                        </Button>
                        <Button disabled={form.processing}>Save changes</Button>
                    </div>
                </form>
            </div>
        </>
    );
}

EditProduct.layout = {
    breadcrumbs: [
        {
            title: 'Products',
            href: index(),
        },
        {
            title: 'Edit product',
            href: editRoute({ product: 0 }),
        },
    ],
};
