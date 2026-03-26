import { Head, Form } from '@inertiajs/react';
import BusinessSettingsController from '@/actions/App/Http/Controllers/Settings/BusinessSettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import { formatCurrency, formatNumber } from '@/lib/format';
import { edit } from '@/routes/business-settings';

type Props = {
    settings: {
        invoice_prefix: string;
        invoice_next_number: string;
        invoice_number_padding: string;
        riel_exchange_rate: string;
        low_stock_threshold: string;
        store_name: string;
        store_phone: string;
        receipt_footer: string;
        printer_ip: string;
        printer_port: string;
    };
    invoicePreview: string;
};

export default function BusinessSettings({ settings, invoicePreview }: Props) {
    return (
        <>
            <Head title="Business settings" />

            <div className="flex flex-col gap-6">
                <Heading
                    title="Business settings"
                    description="Control invoice numbering and the Riel exchange rate used by the POS."
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Next invoice preview</CardTitle>
                            <CardDescription>
                                This preview updates after you save changes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <p className="text-3xl font-semibold tracking-tight">
                                {invoicePreview}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                The current sequence uses{' '}
                                {settings.invoice_number_padding}-digit padding.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Exchange rate</CardTitle>
                            <CardDescription>
                                Saved for future sales so receipts and reporting
                                can use a historical rate.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <p>
                                1 USD ={' '}
                                {formatNumber(settings.riel_exchange_rate)} Riel
                            </p>
                            <p>
                                Example conversion: {formatCurrency(10)} ={' '}
                                {formatNumber(
                                    Number(settings.riel_exchange_rate) * 10,
                                )}{' '}
                                Riel
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Receipt printer</CardTitle>
                            <CardDescription>
                                Configure your XPrinter network address so the
                                app can print receipts directly over TCP.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <p>
                                Printer IP:{' '}
                                {settings.printer_ip || 'Not configured'}
                            </p>
                            <p>Printer port: {settings.printer_port}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Update business settings</CardTitle>
                        <CardDescription>
                            Only administrators should change invoice sequencing
                            or the exchange rate.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form
                            {...BusinessSettingsController.update.form()}
                            className="flex flex-col gap-6"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="store_name">
                                                Store name
                                            </Label>
                                            <Input
                                                id="store_name"
                                                name="store_name"
                                                defaultValue={
                                                    settings.store_name
                                                }
                                            />
                                            <InputError
                                                message={errors.store_name}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="store_phone">
                                                Store phone
                                            </Label>
                                            <Input
                                                id="store_phone"
                                                name="store_phone"
                                                defaultValue={
                                                    settings.store_phone
                                                }
                                            />
                                            <InputError
                                                message={errors.store_phone}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="invoice_prefix">
                                                Invoice prefix
                                            </Label>
                                            <Input
                                                id="invoice_prefix"
                                                name="invoice_prefix"
                                                defaultValue={
                                                    settings.invoice_prefix
                                                }
                                                placeholder="INV"
                                            />
                                            <InputError
                                                message={errors.invoice_prefix}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="invoice_next_number">
                                                Next invoice number
                                            </Label>
                                            <Input
                                                id="invoice_next_number"
                                                name="invoice_next_number"
                                                type="number"
                                                min={1}
                                                defaultValue={
                                                    settings.invoice_next_number
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.invoice_next_number
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="invoice_number_padding">
                                                Invoice padding
                                            </Label>
                                            <Input
                                                id="invoice_number_padding"
                                                name="invoice_number_padding"
                                                type="number"
                                                min={4}
                                                max={10}
                                                defaultValue={
                                                    settings.invoice_number_padding
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.invoice_number_padding
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="riel_exchange_rate">
                                                Riel exchange rate
                                            </Label>
                                            <Input
                                                id="riel_exchange_rate"
                                                name="riel_exchange_rate"
                                                type="number"
                                                min={1}
                                                defaultValue={
                                                    settings.riel_exchange_rate
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.riel_exchange_rate
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="low_stock_threshold">
                                                Low stock threshold
                                            </Label>
                                            <Input
                                                id="low_stock_threshold"
                                                name="low_stock_threshold"
                                                type="number"
                                                min={0}
                                                defaultValue={
                                                    settings.low_stock_threshold
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.low_stock_threshold
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="printer_ip">
                                                Printer IP
                                            </Label>
                                            <Input
                                                id="printer_ip"
                                                name="printer_ip"
                                                defaultValue={
                                                    settings.printer_ip
                                                }
                                                placeholder="192.168.1.50"
                                            />
                                            <InputError
                                                message={errors.printer_ip}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="printer_port">
                                                Printer port
                                            </Label>
                                            <Input
                                                id="printer_port"
                                                name="printer_port"
                                                type="number"
                                                defaultValue={
                                                    settings.printer_port
                                                }
                                            />
                                            <InputError
                                                message={errors.printer_port}
                                            />
                                        </div>

                                        <div className="grid gap-2 md:col-span-2">
                                            <Label htmlFor="receipt_footer">
                                                Receipt footer
                                            </Label>
                                            <Input
                                                id="receipt_footer"
                                                name="receipt_footer"
                                                defaultValue={
                                                    settings.receipt_footer
                                                }
                                            />
                                            <InputError
                                                message={errors.receipt_footer}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button disabled={processing}>
                                            Save settings
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BusinessSettings.layout = {
    breadcrumbs: [
        {
            title: 'Business settings',
            href: edit(),
        },
    ],
};
