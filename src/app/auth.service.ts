import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  

    //private apiUrl = 'http://172.16.8.154:3300/api';
    baseURL = environment.baseURL;
  
    constructor(private http: HttpClient) { }
  
    login(data:any): Observable<any> {   
      return this.http.post(this.baseURL + 'login', data);
    }
  
    username : string = ''
    sendUserName(uname : string)
    {
      this.username = uname
    }
  
    setUserName()
    {
      return this.username
    }

    useLogOut(data: any) {
      return new Promise((resolve, reject) => {
          this.http.post(environment.baseURL + 'logout', data).subscribe(resData => {
              resolve(resData)
          }, (error: HttpErrorResponse) => {
              resolve(error)
          })
      });
  }
  
  }
