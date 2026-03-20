import {makeAutoObservable} from "mobx";

export class StateManager {
    constructor() {
        makeAutoObservable(this);
    }
}