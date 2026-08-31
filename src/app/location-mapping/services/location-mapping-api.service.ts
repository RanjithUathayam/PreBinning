import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
        return this.http.get(this.baseURL + 'location-mapping/warehouses', { headers: this.getHeaders() });
    }

    getRows(whsCode: string): Observable<any> {
        const params = new HttpParams().set('whsCode', whsCode);
        return this.http.get(this.baseURL + 'location-mapping/rows', { headers: this.getHeaders(), params });
    }

    getAvailablePositions(whsCode: string, rowCode: string): Observable<any> {
        const params = new HttpParams().set('whsCode', whsCode).set('rowCode', rowCode);
        return this.http.get(this.baseURL + 'location-mapping/positions', { headers: this.getHeaders(), params });
    }

    validatePallet(payload: { palletQr: string; locationCode: string }): Observable<any> {
        return this.http.post(this.baseURL + 'location-mapping/pallet/validate', payload, { headers: this.getHeaders() });
    }

    mapLocation(payload: { palletId: string; whsCode: string; rowCode: string; locationCode: string }): Observable<any> {
        return this.http.post(this.baseURL + 'location-mapping/map', payload, { headers: this.getHeaders() });
    }
}
