let beforeEachFn;

export const beforeEach = fn => {
    beforeEachFn = fn;
};

export const it = async (name: string, test: Function) => {
    try {
        let arg;
        if (beforeEachFn) {
            arg = await beforeEachFn;
        }
        await test(arg);
        console.log('passed:', name);
    } catch (e) {
        console.error('failed:', name);
        console.error(e);
    }
}