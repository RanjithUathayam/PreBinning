import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

    baseURL = environment.baseURL;
    token:any = localStorage.getItem('Token');
    option = new HttpHeaders().set('authenticatetoken',this.token)
    constructor(private http: HttpClient) { }

    getauthenticateToken() {
        this.token = localStorage.getItem('Token');
        this.option = new HttpHeaders().set('authenticatetoken', this.token);
        return this.option
    }

    GetGrnList()
    {
        return this.http.get(this.baseURL+'HHT/getPendingGRN',{'headers':this.getauthenticateToken()})
    }

    GetGrnListDataStatus(){
        return this.http.get(this.baseURL+'HHT/getGRNStatus',{'headers':this.option})     
    }

    SendSelectedGrn(grn: string): Observable<any>{
        const payload = { GRNNo: grn };
        return this.http.post(this.baseURL+'HHT/getGRNDetails', payload,{'headers':this.option})
    }

    CompleteGRN(data : any)
    {
        return this.http.post(this.baseURL+'HHT/binComplete', data,{'headers':this.option})
    }
    
    getBinIdInfo(data : any)
    {
        return this.http.post(this.baseURL+'HHT/getBinDetails', data, {'headers':this.option})
    }

    completeItem(data : any)
    { 
        return this.http.post(this.baseURL + 'HHT/completeItem', data, {'headers' : this.option})
    }

    submitEmptyBinStore(data: any) {
        return this.http.post(this.baseURL + 'operation/EmptyBinStore', data, { 'headers': this.option });
    }

    getBinIdInfoForRefilling(data : any)
    {
        return this.http.post(this.baseURL+'HHT/getBinDetailsForRefilling', data, {'headers':this.option})
    }
 
    updaterefilledbin(data : any)
    {
        return this.http.post(this.baseURL + 'HHT/updateRefilledBin', data, {'headers' : this.option})
    }
 
    updateStockAdjustmentHHT(data : any)
    {
        return this.http.post(this.baseURL + 'HHT/updateStock', data, {'headers' : this.option})
    }

}
