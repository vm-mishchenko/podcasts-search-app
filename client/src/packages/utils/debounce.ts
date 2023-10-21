export const debounce = (func: any, delay: number) => {
    let timerId: any;

    return function (...args: any[]) {
        if (timerId) {
            clearTimeout(timerId);
        }

        timerId = setTimeout(() => {
            func.apply(null, args);
            timerId = null;
        }, delay);
    };
}
