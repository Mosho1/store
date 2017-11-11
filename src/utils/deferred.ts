export class Deferred<T> implements IDeferred<T> {
    resolve: Function;
    reject: Function;
    resolveForce: Function;
    rejectForce: Function;
    promise: Promise<T>;
    subscribedTo = false;
    deactivated = false;

    wrapActivation = (fn) => {
        return (...args) => {
            if (!this.deactivated) {
                fn(...args);
            }
        }
    }

    constructor(deferred?: Deferred<any> | null) {
        this.promise = new Promise((resolve, reject) => {
            let res, rej;
            if (deferred) {
                deferred.deactivated = true;
                res = (data) => {
                    deferred.resolveForce(data);
                    resolve(data);
                };
                rej = (error) => {
                    deferred.rejectForce(error);
                    reject(error);
                };
            } else {
                res = resolve;
                rej = reject;
            }
            this.resolve = this.wrapActivation(res);
            this.reject = this.wrapActivation(rej);
            this.resolveForce = res;
            this.rejectForce = rej;
        });
    }
}
