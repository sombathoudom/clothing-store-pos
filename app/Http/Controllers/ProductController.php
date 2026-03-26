<?php

namespace App\Http\Controllers;

use App\Enums\Size;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $categoryId = $request->integer('category_id');
        $status = $request->string('status')->toString();

        $products = Product::query()
            ->with(['category:id,name', 'variants:id,product_id,size'])
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->when($categoryId > 0, fn ($query) => $query->where('category_id', $categoryId))
            ->when($status !== '', fn ($query) => $query->where('is_active', $status === 'active'))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Product $product): array => [
                'id' => $product->id,
                'name' => $product->name,
                'image_url' => $product->image_path === null
                    ? null
                    : Storage::url($product->image_path),
                'is_active' => $product->is_active,
                'category' => [
                    'id' => $product->category?->id,
                    'name' => $product->category?->name,
                ],
                'sizes' => $product->variants
                    ->map(fn ($variant) => $variant->size->value)
                    ->sort()
                    ->values()
                    ->all(),
                'created_at' => $product->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('products/index', [
            'products' => $products,
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId > 0 ? (string) $categoryId : '',
                'status' => $status,
            ],
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('products/create', [
            'categories' => $this->categoryOptions(),
            'sizes' => Size::values(),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $product = Product::create([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'image_path' => $request->file('image')?->store('products', 'public'),
            'is_active' => (bool) $validated['is_active'],
        ]);

        $product->variants()->createMany(
            collect($validated['sizes'])
                ->unique()
                ->values()
                ->map(fn (string $size): array => ['size' => $size])
                ->all(),
        );

        return to_route('products.index')->with('flash', [
            'type' => 'success',
            'message' => 'Product created successfully.',
        ]);
    }

    public function edit(Product $product): Response
    {
        $product->load(['category:id,name', 'variants:id,product_id,size']);

        return Inertia::render('products/edit', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'image_url' => $product->image_path === null
                    ? null
                    : Storage::url($product->image_path),
                'category_id' => (string) $product->category_id,
                'is_active' => $product->is_active,
                'sizes' => $product->variants->map(fn ($variant) => $variant->size->value)->values()->all(),
            ],
            'categories' => $this->categoryOptions(),
            'sizes' => Size::values(),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $validated = $request->validated();
        $imagePath = $product->image_path;

        if ($request->hasFile('image')) {
            if ($imagePath !== null) {
                Storage::disk('public')->delete($imagePath);
            }

            $imagePath = $request->file('image')->store('products', 'public');
        }

        $product->update([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'image_path' => $imagePath,
            'is_active' => (bool) $validated['is_active'],
        ]);

        $selectedSizes = collect($validated['sizes'])->unique()->values();

        $product->variants()->whereNotIn('size', $selectedSizes)->delete();

        $existingSizes = $product->variants()
            ->get()
            ->map(fn ($variant) => $variant->size->value);

        $product->variants()->createMany(
            $selectedSizes
                ->reject(fn (string $size) => $existingSizes->contains($size))
                ->map(fn (string $size): array => ['size' => $size])
                ->all(),
        );

        return to_route('products.index')->with('flash', [
            'type' => 'success',
            'message' => 'Product updated successfully.',
        ]);
    }

    /**
     * @return array<int, array{id: string, name: string}>
     */
    private function categoryOptions(): array
    {
        return Category::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Category $category): array => [
                'id' => (string) $category->id,
                'name' => $category->name,
            ])
            ->all();
    }
}
