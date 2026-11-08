import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import InputError from '@/components/input-error';

type TurnstileApi = {
    render: (
        container: HTMLElement,
        options: { sitekey: string; theme?: 'auto' | 'light' | 'dark' },
    ) => string;
    reset: (widgetId: string) => void;
    remove: (widgetId: string) => void;
};

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

const scriptUrl =
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<TurnstileApi> | null = null;

/** Loads Cloudflare's script once, however many widgets are on the page. */
function loadTurnstile(): Promise<TurnstileApi> {
    if (window.turnstile) {
        return Promise.resolve(window.turnstile);
    }

    scriptPromise ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.onload = () =>
            window.turnstile
                ? resolve(window.turnstile)
                : reject(new Error('Turnstile failed to load'));
        script.onerror = () => {
            scriptPromise = null;
            reject(new Error('Turnstile failed to load'));
        };
        document.head.appendChild(script);
    });

    return scriptPromise;
}

/**
 * Cloudflare's "not a robot" check. Renders nothing until the platform sets
 * Turnstile keys. The widget adds its own hidden `cf-turnstile-response`
 * input, so it only needs to sit inside the form. Pass the form's errors so
 * a fresh check is issued after a failed submit (each token works once).
 */
export function TurnstileWidget({
    errors,
}: {
    errors: Record<string, string | undefined>;
}) {
    const { turnstileSiteKey } = usePage().props;
    const container = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const errorKey = JSON.stringify(errors);

    useEffect(() => {
        if (!turnstileSiteKey || !container.current) {
            return;
        }

        let isCancelled = false;
        const element = container.current;

        loadTurnstile()
            .then((turnstile) => {
                if (!isCancelled) {
                    widgetId.current = turnstile.render(element, {
                        sitekey: turnstileSiteKey,
                        theme: 'auto',
                    });
                }
            })
            .catch(() => {});

        return () => {
            isCancelled = true;

            if (widgetId.current) {
                window.turnstile?.remove(widgetId.current);
                widgetId.current = null;
            }
        };
    }, [turnstileSiteKey]);

    useEffect(() => {
        if (errorKey !== '{}' && widgetId.current) {
            window.turnstile?.reset(widgetId.current);
        }
    }, [errorKey]);

    if (!turnstileSiteKey) {
        return null;
    }

    return (
        <div className="space-y-1">
            <div ref={container} className="min-h-[65px]" />
            <InputError message={errors['cf-turnstile-response']} />
        </div>
    );
}
