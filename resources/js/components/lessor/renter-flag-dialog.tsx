import { useForm } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import lessor from '@/routes/lessor';

/**
 * Flag a renter with a private note (or edit or clear it). Their future
 * bookings show the note as a warning.
 */
export function RenterFlagDialog({
    renterKey,
    renterName,
    flag,
    trigger,
}: {
    renterKey: string;
    renterName: string;
    flag: string | null;
    trigger: ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const form = useForm({ note: flag ?? '' });

    function save(note: string): void {
        form.transform(() => ({ note }));
        form.put(lessor.renters.flag(renterKey).url, {
            preserveScroll: true,
            onSuccess: () => setIsOpen(false),
        });
    }

    function submit(event: FormEvent): void {
        event.preventDefault();
        save(form.data.note);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>
                            {flag ? 'Edit flag' : 'Flag'} {renterName}
                        </DialogTitle>
                        <DialogDescription>
                            Only you see this. It shows as a warning on their
                            bookings with you.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Textarea
                            aria-label="Why you flagged them"
                            rows={3}
                            maxLength={200}
                            autoFocus
                            value={form.data.note}
                            onChange={(event) =>
                                form.setData('note', event.target.value)
                            }
                            placeholder="e.g. Returned the car late with no fuel."
                        />
                        <InputError message={form.errors.note} />
                    </div>
                    <DialogFooter className="gap-2">
                        {flag && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="mr-auto"
                                disabled={form.processing}
                                onClick={() => save('')}
                            >
                                Remove flag
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={form.processing || !form.data.note.trim()}
                        >
                            Save flag
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
