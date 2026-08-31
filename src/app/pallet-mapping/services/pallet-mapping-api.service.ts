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

    validatePallet(payload: { palletQr: string }): Observable<any> {
        return this.http.post(this.baseURL + 'pallet-mapping/pallet/validate', payload, { headers: this.getHeaders() });
    }

    getPalletBoxes(palletId: string): Observable<any> {
        return this.http.get(this.baseURL + 'pallet-mapping/pallet/' + encodeURIComponent(palletId) + '/boxes', { headers: this.getHeaders() });
    }

    scanBox(payload: { palletId: string; boxQr: string }): Observable<any> {
        return this.http.post(this.baseURL + 'pallet-mapping/box/scan', payload, { headers: this.getHeaders() });
    }

    completePallet(payload: { palletId: string }): Observable<any> {
        return this.http.post(this.baseURL + 'pallet-mapping/pallet/complete', payload, { headers: this.getHeaders() });
    }
}
