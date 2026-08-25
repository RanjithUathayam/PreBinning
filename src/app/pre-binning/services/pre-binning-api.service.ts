import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PreBinningApiService {

    baseURL = environment.baseURL;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('Token');
        return new HttpHeaders().set('authenticatetoken', token || '');
    }

    getWarehouses(): Observable<any> {
        return this.http.get(this.baseURL + 'pre-binning/warehouses', { headers: this.getHeaders() });
    }

    getWarehouseStock(params: { whsCode?: string; locationCode?: string; itemGroup?: string; itemCode?: string; grnNo?: string }): Observable<any> {
        let httpParams = new HttpParams();
        Object.keys(params || {}).forEach((key) => {
            const value = (params as any)[key];
            if (value !== undefined && value !== null && value !== '') {
                httpParams = httpParams.set(key, value);
            }
        });
        return this.http.get(this.baseURL + 'pre-binning/warehouse-stock', { headers: this.getHeaders(), params: httpParams });
    }

    validateBox(payload: { boxQr: string; whsCode: string }): Observable<any> {
        return this.http.post(this.baseURL + 'pre-binning/box/validate', payload, { headers: this.getHeaders() });
    }

    scanItem(payload: { boxNumber: string; itemCode: string; type: string; grnNo: string; itemGroup: string; uniqueNumber: string; qty: number; whsCode: string }): Observable<any> {
        return this.http.post(this.baseURL + 'pre-binning/item/scan', payload, { headers: this.getHeaders() });
    }

    getBoxItems(boxNumber: string): Observable<any> {
        return this.http.get(this.baseURL + 'pre-binning/box/' + encodeURIComponent(boxNumber) + '/items', { headers: this.getHeaders() });
    }

    completeBox(payload: { boxNumber: string; whsCode: string }): Observable<any> {
        return this.http.post(this.baseURL + 'pre-binning/box/complete', payload, { headers: this.getHeaders() });
    }
}
