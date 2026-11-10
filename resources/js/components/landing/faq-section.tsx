/** Answers to what owners ask before signing up. */
const questions = [
    {
        question: 'Do you take a cut of my bookings?',
        answer: 'No. Renters pay you directly, at pickup or by bank transfer. You only pay your plan.',
    },
    {
        question: 'How do I pay?',
        answer: 'We send an invoice each month, or once a year on yearly billing. Pay by bank transfer or e-wallet and upload the receipt in your dashboard.',
    },
    {
        question: 'Do texts cost extra?',
        answer: 'Texts use prepaid text credits that you load separately (about ₱0.50 a text). We set it up for you. Emails are included.',
    },
    {
        question: 'Can I change plans later?',
        answer: 'Anytime, from Billing. The new price starts with your next invoice.',
    },
];

export function FaqSection() {
    return (
        <section className="border-t bg-background">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                    <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                        Questions
                    </p>
                    <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">
                        Good to know.
                    </h2>
                </div>
                <dl className="divide-y border-y">
                    {questions.map(({ question, answer }) => (
                        <div key={question} className="py-5">
                            <dt className="font-semibold">{question}</dt>
                            <dd className="mt-1.5 text-muted-foreground">
                                {answer}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
