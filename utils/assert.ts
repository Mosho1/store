export const getAssert = (isProd, report) => (condition: any, message: string | Error, strict = true) => {

    if (condition) return true;

    const err = typeof message === 'string' ? new Error(message) : message;
    if (isProd) {
        if (strict) {
            report(err);
        } else {
            console.error(err);
        }
    } else {
        if (strict) {
            throw err;
        } else {
            console.error(err);
        }
    }
    return false;
};

export default getAssert(false, () => null);