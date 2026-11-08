/** Body types that are two-wheelers: riders instead of seats, no doors or drivetrain. */
const TWO_WHEELER_BODY_TYPES = ['scooter', 'motorcycle'];

/**
 * Whether a body type value (e.g. "scooter") is a two-wheeler.
 */
export function isTwoWheeler(bodyType: string | null | undefined): boolean {
    return TWO_WHEELER_BODY_TYPES.includes(bodyType ?? '');
}
