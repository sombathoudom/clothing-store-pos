import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import {
    print as printSale,
    receipt as receiptRoute,
    show,
} from '@/routes/sales';

type Props = {
    store: {
        name: string;
        phone: string;
        footer: string;
    };
    sale: {
        id: number;
        invoice_no: string;
        customer_name: string | null;
        customer_phone: string | null;
        status: string;
        total_amount: string;
        discount: string;
        final_amount: string;
        riel_exchange_rate: string;
        sold_at: string | null;
        items: Array<{
            id: number;
            product_name: string;
            size: string;
            qty: number;
            sell_price: string;
            subtotal: string;
        }>;
    };
};

export default function SalesReceipt({ store, sale }: Props) {
    const printForm = useForm({});

    return (
        <>
            <Head title={`${sale.invoice_no} receipt`} />

            <div className="min-h-screen bg-neutral-100 p-4 print:bg-white print:p-0">
                <div className="mx-auto flex max-w-sm flex-col gap-4 print:max-w-[320px] print:gap-0">
                    <div className="flex items-center justify-between print:hidden">
                        <Button variant="outline" asChild>
                            <Link href={show(sale.id)} prefetch>
                                Back to sale
                            </Link>
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                            >
                                Browser print
                            </Button>
                            <Button
                                disabled={printForm.processing}
                                onClick={() =>
                                    printForm.post(printSale.url(sale.id), {
                                        preserveScroll: true,
                                    })
                                }
                            >
                                Send to XPrinter
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm print:rounded-none print:p-4 print:shadow-none">
                        <div className="text-center">
                            <h1 className="text-lg font-bold tracking-wide uppercase">
                                {store.name}
                            </h1>
                            {store.phone ? (
                                <p className="text-sm text-muted-foreground">
                                    {store.phone}
                                </p>
                            ) : null}
                            <p className="mt-2 text-xs tracking-[0.2em] text-muted-foreground uppercase">
                                Receipt
                            </p>
                        </div>

                        <div className="mt-4 border-t border-dashed pt-4 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span>Invoice</span>
                                <span className="font-medium">
                                    {sale.invoice_no}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-4">
                                <span>Date</span>
                                <span>{formatDateTime(sale.sold_at)}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-4">
                                <span>Customer</span>
                                <span>{sale.customer_name ?? 'Walk-in'}</span>
                            </div>
                        </div>

                        <div className="mt-4 border-t border-dashed pt-4">
                            {sale.items.map((item) => (
                                <div key={item.id} className="mb-3 last:mb-0">
                                    <div className="flex items-start justify-between gap-3 text-sm">
                                        <div>
                                            <p className="font-medium">
                                                {item.product_name}
                                            </p>
                                            <p className="text-muted-foreground">
                                                Size {item.size}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p>
                                                {formatCurrency(item.subtotal)}
                                            </p>
                                            <p className="text-muted-foreground">
                                                {formatNumber(item.qty)} x{' '}
                                                {formatCurrency(
                                                    item.sell_price,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 border-t border-dashed pt-4 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span>Subtotal</span>
                                <span>{formatCurrency(sale.total_amount)}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-4">
                                <span>Discount</span>
                                <span>{formatCurrency(sale.discount)}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-4 text-base font-semibold">
                                <span>Total</span>
                                <span>{formatCurrency(sale.final_amount)}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-4 text-muted-foreground">
                                <span>KHR</span>
                                <span>
                                    {formatNumber(
                                        Number(sale.final_amount) *
                                            Number(sale.riel_exchange_rate),
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-dashed pt-4 text-center text-xs text-muted-foreground">
                            {store.footer}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

SalesReceipt.layout = {
    breadcrumbs: [
        {
            title: 'Receipt',
            href: receiptRoute({ sale: 0 }),
        },
    ],
};
