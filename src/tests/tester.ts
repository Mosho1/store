let beforeEachFn;

export const beforeEach = fn => {
    beforeEachFn = fn;
};

interface IT {
    (name: string, test: Function): void;
    only: (name: string, test: Function) => void;
}

const tests: Function[] = []
const onlyTests: Function[] = [];

const runTests = () => {
    if (onlyTests.length > 0) {
        onlyTests.forEach(fn => fn());
    } else {
        tests.forEach(fn => fn());
    }
};

let timeoutId = setTimeout(runTests, 10);

const makeTest = (name: string, test: Function) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(runTests, 10);
    return async () => {
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
    };
};

export const it: IT = ((name: string, test: Function) => {
    tests.push(makeTest(name, test));
}) as IT;

it.only = (name: string, test: Function) => {
    onlyTests.push(makeTest(name, test));
}

export const describe = (_, fn) => fn();