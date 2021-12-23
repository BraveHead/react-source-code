const MAX_SIGNED_31_BIT_INT = 1073741823; // (2**31) / 2 - 1
export const NoWork = 0;
export const Never = 1;
export const Sync = MAX_SIGNED_31_BIT_INT;

const UNIT_SIZE = 10;

export function msToExpirationTime(ms) {
    /*
        (xxx | 0) 意思就是给 xxx 取整
    */
    return MAX_SIGNED_31_BIT_INT - ((ms / UNIT_SIZE) | 0);
};