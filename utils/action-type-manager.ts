
export const ActionStates: {
    [index: string]: ActionState;
    SUCCESS: 'success';
    START: 'start';
    ERROR: 'error';
} = {
        SUCCESS: 'success',
        START: 'start',
        ERROR: 'error'
    };

// contextual manager for action names
export default class ActionTypeManager {
    static SUCCESS = ActionStates.SUCCESS;
    static START = ActionStates.START;
    static ERROR = ActionStates.ERROR;
    static delimiter = '.';
    typeName: string;
    namespace: string;
    state: string;

    constructor(actionType: string)
    constructor(typeName: string, namespace?: string, state?: string)
    constructor(typeName: string, namespace?: string, state?: string) {

        if (typeof namespace === 'undefined' && typeof state === 'undefined') {
            const [_namespace, _typeName, _state] = typeName.split(ActionTypeManager.delimiter);
            this.namespace = _namespace || namespace || '';
            this.typeName = _typeName || typeName;
            this.state = _state || state || '';
        } else {
            this.namespace = namespace || '';
            this.typeName = typeName;
            this.state = state || '';
        }

    }

    private addNamespace(str: string) {
        return this.namespace
            ? this.namespace + ActionTypeManager.delimiter + str
            : str;
    }

    getType() {
        return this.addNamespace(this.typeName);
    }

    getTypeWithState(state: ActionState) {
        return this.getType() + ActionTypeManager.delimiter + state;
    }

    isAtState(state: ActionState) {
        return this.state === state;
    }

    success() {
        return this.getTypeWithState(ActionTypeManager.SUCCESS);
    }

    isSuccess() {
        return this.isAtState(ActionTypeManager.SUCCESS);
    }

    start() {
        return this.getTypeWithState(ActionTypeManager.START);
    }

    isStart() {
        return this.isAtState(ActionTypeManager.START);
    }

    error() {
        return this.getTypeWithState(ActionTypeManager.ERROR);
    }

    isError() {
        return this.isAtState(ActionTypeManager.ERROR);
    }
}