import { Form } from '@inertiajs/react';
import BookingLookupController from '@/actions/App/Http/Controllers/Public/BookingLookupController';
import { FormField } from '@/components/form-field';
import { BrandButton } from '@/components/public/brand-button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

/**
 * Reference + email form for finding a booking, shared by Rentiva's own page
 * and each owner's storefront.
 */
export function BookingLookupForm() {
    return (
        <Form {...BookingLookupController.store.form()} className="space-y-4">
            {({ processing, errors }) => (
                <>
                    <FormField
                        id="reference"
                        label="Booking reference"
                        error={errors.reference}
                    >
                        <Input
                            id="reference"
                            name="reference"
                            required
                            placeholder="RNT-7KQ2XM"
                            className="uppercase"
                        />
                    </FormField>
                    <FormField id="email" label="Email" error={errors.email}>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                        />
                    </FormField>
                    <BrandButton
                        type="submit"
                        className="h-11 w-full rounded-full text-base"
                        size="lg"
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Find booking
                    </BrandButton>
                </>
            )}
        </Form>
    );
}
