import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class LocationMappingApiService {

    baseURL = environment.baseURL;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('Token');
        return new HttpHeaders().set('authenticatetoken', token || '');
    }

    getWarehouses(): Observable<any> {
        return this.http.get(this.baseURL + 'location/warehouses', { headers: this.getHeaders() });
    }

    getRows(whsCode: string): Observable<any> {
        return this.http.get(this.baseURL + 'location/warehouse/' + encodeURIComponent(whsCode) + '/rows', { headers: this.getHeaders() });
    }

    getAvailablePositions(whsCode: string, rowCode: string): Observable<any> {
        return this.http.get(
            this.baseURL + 'location/warehouse/' + encodeURIComponent(whsCode) + '/row/' + encodeURIComponent(rowCode) + '/positions',
            { headers: this.getHeaders() }
        );
    }

    getPalletMapping(palletId: string): Observable<any> {
        return this.http.get(this.baseURL + 'pallet-mapping/pallet/' + encodeURIComponent(palletId), { headers: this.getHeaders() });
    }

    mapLocation(payload: { palletId: string; whsCode: string; rowCode: string; locationCode: string }): Observable<any> {
        return this.http.post(this.baseURL + 'location-mapping/map', payload, { headers: this.getHeaders() });
    }
}
