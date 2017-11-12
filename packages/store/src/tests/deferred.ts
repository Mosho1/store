import { Deferred } from '../utils/deferred';
import { expect } from 'chai';
import { it, describe } from './tester';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

describe('deferred', () => {
    it('should work', async () => {
        const deferred = new Deferred();
        let flag = false;
        const promise = deferred.promise.then(() => {
            flag = true;
        });
        expect(flag).to.be.false;
        await delay(10);
        expect(flag).to.be.false;
        deferred.resolve();
        await promise;
        expect(flag).to.be.true;
    });

    it('should work nested', async () => {
        const deferred = new Deferred();
        const deferredNested = new Deferred(deferred);

        let flag = false;
        let flag2 = false;

        deferred.promise.then(() => {
            flag = true;
        });

        deferredNested.promise.then(() => {
            flag2 = true;
        });

        expect(flag).to.be.false;
        expect(flag2).to.be.false;
        await delay(10);
        expect(flag).to.be.false;
        deferred.resolve();
        await delay(10);
        expect(flag).to.be.false;
        expect(flag2).to.be.false;
        await delay(10);
        expect(flag).to.be.false;
        expect(flag2).to.be.false;
        deferredNested.resolve();
        await delay(10);
        expect(flag).to.be.true;
        expect(flag2).to.be.true;
    });

    it('should work nested multiple', async () => {
        const deferreds: Deferred<any>[] = [new Deferred()];
        let counter = 0;
        for (let i = 0; i < 10; i++) {
            deferreds.push(new Deferred(deferreds[i]));
            deferreds[i].promise.then(() => {
                counter++;
            });
        }

        expect(counter).to.equal(0);

        for (let i = 0; i < deferreds.length - 2; i++) {
            deferreds[i].resolve();
        }

        expect(counter).to.equal(0);
        await delay(10);
        expect(counter).to.equal(0);

        deferreds[deferreds.length - 1].resolve();
        await delay(10);
        expect(counter).to.equal(deferreds.length - 1);
    });
});