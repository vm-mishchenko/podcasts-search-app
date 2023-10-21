import {useEffect, useState} from 'react'

// https://github.com/juliencrn/usehooks-ts/blob/8480d904dd857af2bd0cff4a19cb36fa5b44d18b/packages/usehooks-ts/src/useDebounce/useDebounce.ts#L3
export const useDebounce = <T>(value: T, delay: number, callback: () => void): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        if (!value) {
            setDebouncedValue(value);
            callback();
            return;
        }

        const timer = setTimeout(() => {
            setDebouncedValue(value);
            callback();
        }, delay || 500)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}
