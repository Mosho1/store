export class Deferred<T> implements IDeferred<T> {
    resolve: Function;
    reject: Function;
    promise: Promise<T>;
    subscribedTo = false;
    constructor(deferred?: Deferred<any> | null) {
        this.promise = new Promise((resolve, reject) => {
            if (deferred) {
                this.resolve = () => {
                    deferred.resolve();
                    resolve();
                };
                this.reject = (error) => {
                    deferred.reject(error);
                    reject(error);
                };
            } else {
                this.resolve = resolve;
                this.reject = reject;
            }
        });
    }
}
