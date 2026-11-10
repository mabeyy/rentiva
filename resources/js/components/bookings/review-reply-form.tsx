import { useForm } from '@inertiajs/react';
import { MessageSquareReply } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import lessor from '@/routes/lessor';

/**
 * The owner's reply to a review: shown when there is one, with a small form
 * to write, edit or remove it. The renter sees it on their booking page.
 */
export function ReviewReplyForm({
    reviewId,
    reply,
    renterName,
}: {
    reviewId: number;
    reply: string | null;
    /** Shown on the button, e.g. "Reply to Juan". */
    renterName?: string;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const form = useForm({ owner_reply: reply ?? '' });

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.put(lessor.reviews.reply(reviewId).url, {
            preserveScroll: true,
            onSuccess: () => setIsEditing(false),
        });
    }

    if (reply && !isEditing) {
        return (
            <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3 text-sm">
                <p className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <MessageSquareReply className="size-3.5" />
                        Your reply
                    </span>
                    <button
                        type="button"
                        className="font-medium hover:text-foreground"
                        onClick={() => setIsEditing(true)}
                    >
                        Edit
                    </button>
                </p>
                <p className="mt-1 whitespace-pre-line">{reply}</p>
            </div>
        );
    }

    if (!isEditing) {
        return (
            <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                onClick={() => setIsEditing(true)}
            >
                <MessageSquareReply className="size-4" />
                {renterName ? `Reply to ${renterName.split(' ')[0]}` : 'Reply'}
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-2">
            <Textarea
                aria-label="Your reply"
                rows={3}
                maxLength={1000}
                autoFocus
                value={form.data.owner_reply}
                onChange={(event) =>
                    form.setData('owner_reply', event.target.value)
                }
                placeholder="Thank them, or explain what you've changed."
            />
            <InputError message={form.errors.owner_reply} />
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                        form.reset();
                        setIsEditing(false);
                    }}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    size="sm"
                    className="rounded-full"
                    disabled={form.processing}
                >
                    {form.processing && <Spinner />}
                    {reply && !form.data.owner_reply.trim()
                        ? 'Remove reply'
                        : 'Post reply'}
                </Button>
            </div>
        </form>
    );
}
