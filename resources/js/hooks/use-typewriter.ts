import { useEffect, useState } from 'react';

const TYPE_DELAY_MS = 90;
const DELETE_DELAY_MS = 45;
const HOLD_DELAY_MS = 1600;

function prefersReducedMotion(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

/**
 * Types each word, holds it, deletes it, then moves to the next one.
 * Shows the first word without animation when the user prefers reduced motion.
 */
export function useTypewriter(words: string[]): string {
    const [wordIndex, setWordIndex] = useState(0);
    const [text, setText] = useState(words[0] ?? '');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (words.length < 2 || prefersReducedMotion()) {
            return;
        }

        const word = words[wordIndex];
        const isWordComplete = !isDeleting && text === word;
        const isWordCleared = isDeleting && text === '';

        const timeout = setTimeout(
            () => {
                if (isWordComplete) {
                    setIsDeleting(true);
                } else if (isWordCleared) {
                    setIsDeleting(false);
                    setWordIndex((index) => (index + 1) % words.length);
                } else {
                    setText(
                        isDeleting
                            ? word.slice(0, text.length - 1)
                            : word.slice(0, text.length + 1),
                    );
                }
            },
            isWordComplete
                ? HOLD_DELAY_MS
                : isDeleting
                  ? DELETE_DELAY_MS
                  : TYPE_DELAY_MS,
        );

        return () => clearTimeout(timeout);
    }, [words, wordIndex, text, isDeleting]);

    return text;
}
