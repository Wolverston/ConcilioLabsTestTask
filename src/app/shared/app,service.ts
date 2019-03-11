import { Injectable } from '@angular/core';

import * as Rx from 'rxjs';
@Injectable({
    providedIn: 'root',
})

export class AppService {
    private news = new Rx.ReplaySubject(1);
    private comments = new Rx.ReplaySubject(1); 
    private commentators = new Rx.ReplaySubject(1); 
    private newsIDs = new Rx.ReplaySubject(1);
    
    setSubject(name, val){
        this[name].next(val)
    }
    getSubject(name){
        return this[name]
    }




    constructor() {}

}