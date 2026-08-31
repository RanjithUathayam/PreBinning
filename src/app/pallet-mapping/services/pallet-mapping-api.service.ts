import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PalletMappingApiService {

    baseURL = environment.baseURL;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('Token');
        return new HttpHeaders().set('authenticatetoken', token || '');
    }

    validatePallet(payload: { palletId: string }): Observable<any> {
        return this.http.post(this.baseURL + 'pallet-mapping/pallet/validate', payload, { headers: this.getHeaders() });
    }

    getPalletMapping(palletId: string): Observable<any> {
        return this.http.get(this.baseURL + 'pallet-mapping/pallet/' + encodeURIComponent(palletId), { headers: this.getHeaders() });
    }

    addBox(payload: { palletId: string; boxNumber: string }): Observable<any> {
        return this.http.post(this.baseURL + 'pallet-mapping/box', payload, { headers: this.getHeaders() });
    }

    completePallet(payload: { palletId: string }): Observable<any> {
        return this.http.post(this.baseURL + 'pallet-mapping/complete', payload, { headers: this.getHeaders() });
    }
}
