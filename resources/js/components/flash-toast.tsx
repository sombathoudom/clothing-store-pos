import { router, usePage } from '@inertiajs/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type FlashState = {
    type: string | null;
    message: string | null;
};

export default function FlashToast() {
    const { flash } = usePage().props as { flash: FlashState };
    const [visibleFlash, setVisibleFlash] = useState<FlashState | null>(
        flash?.message ? flash : null,
    );

    useEffect(() => {
        const removeListener = router.on('flash', (event) => {
            const nextFlash = event.detail.flash as FlashState;

            if (!nextFlash?.message) {
                return;
            }

            setVisibleFlash(nextFlash);

            window.setTimeout(() => {
                setVisibleFlash(null);
            }, 3200);
        });

        return () => {
            removeListener();
        };
    }, []);

    if (!visibleFlash?.message) {
        return null;
    }

    const isSuccess = visibleFlash.type !== 'error';

    return (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <div
                className={
                    isSuccess
                        ? 'pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border border-emerald-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur'
                        : 'pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border border-red-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur'
                }
            >
                <div
                    className={
                        isSuccess
                            ? 'mt-0.5 text-emerald-600'
                            : 'mt-0.5 text-red-600'
                    }
                >
                    {isSuccess ? (
                        <CheckCircle2 className="size-5" />
                    ) : (
                        <XCircle className="size-5" />
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                        {visibleFlash.message}
                    </p>
                </div>
            </div>
        </div>
    );
}
