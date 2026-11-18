import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RackHistoryQuery, RackMode, RackSavePayload } from '../rack-management.types';

@Injectable({
    providedIn: 'root'
})
export class RackManagementApiService {

    baseURL = environment.baseURL;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('Token');
        return new HttpHeaders().set('authenticatetoken', token || '');
    }

    // GET /api/rack/rackwarehouses
    getWarehouses(): Observable<any> {
        return this.http.get(this.baseURL + 'rack/rackwarehouses', { headers: this.getHeaders() });
    }

    // POST /api/rack/rackscan
    scanRack(payload: { mode: RackMode; whsCode: string; rackCode: string }): Observable<any> {
        return this.http.post(this.baseURL + 'rack/rackscan', payload, { headers: this.getHeaders() });
    }

    // POST /api/rack/rackitem
    scanItem(payload: { mode: RackMode; whsCode: string; rackCode: string; itemQr: string; scannedQty: number }): Observable<any> {
        return this.http.post(this.baseURL + 'rack/rackitem', payload, { headers: this.getHeaders() });
    }

    // POST /api/rack/racksave
    save(payload: RackSavePayload): Observable<any> {
        return this.http.post(this.baseURL + 'rack/racksave', payload, { headers: this.getHeaders() });
    }

    // GET /api/rack/rackhistory
    getHistory(query: RackHistoryQuery): Observable<any> {
        let params = new HttpParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, String(value));
            }
        });
        return this.http.get(this.baseURL + 'rack/rackhistory', { headers: this.getHeaders(), params });
    }

    // GET /api/rack/rackhistory/:transactionId
    getHistoryDetail(transactionId: number): Observable<any> {
        return this.http.get(this.baseURL + 'rack/rackhistory/' + transactionId, { headers: this.getHeaders() });
    }
}
