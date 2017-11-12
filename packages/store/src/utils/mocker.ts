import {NestedPartial} from '../types';

export class Mocker {
    defineProperties(properties: NestedPartial<{[k in keyof this]: this[k]}>) {
        let propertiesToDefine: PropertyDescriptorMap = {} as any;
        for (let k in properties) {
            propertiesToDefine[k] = { value: properties[k], writable: true, configurable: true };
        }
        Object.defineProperties(this, propertiesToDefine);
    }
}