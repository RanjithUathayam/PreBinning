import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PickingApiService {

    baseURL = environment.baseURL;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('Token');
        return new HttpHeaders().set('authenticatetoken', token || '');
    }

    // POST /api/picking/pick/pallet
    scanPallet(payload: { palletNumber: string }): Observable<any> {
        return this.http.post(this.baseURL + 'picking/pick/pallet', payload, { headers: this.getHeaders() });
    }

    // POST /api/picking/pick/box
    scanBox(payload: { palletNumber: string; boxNumber: string }): Observable<any> {
        return this.http.post(this.baseURL + 'picking/pick/box', payload, { headers: this.getHeaders() });
    }

    // POST /api/picking/pick/complete
    completePicking(payload: { palletNumber: string; boxNumber: string; itemCode: string; pickedQuantity: number }): Observable<any> {
        return this.http.post(this.baseURL + 'picking/pick/complete', payload, { headers: this.getHeaders() });
    }
}
