import { Component, OnInit,Input } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonItemGroup } from '@ionic/angular';
import { AuthService } from '../../auth.service';
import {StoreinPage} from '../../storein/storein.page'
import { StoreStausPage } from 'src/app/storestatus/storestatus.page';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent  implements OnInit {

  DeviceId:any = localStorage.getItem('DeviceID')
  @Input() title: any;

  constructor(private router:Router,private alertController: AlertController,private authservice: AuthService,private storein: StoreinPage,private storestatus: StoreStausPage) { }
  
  ngOnInit() {
    console.log(localStorage.getItem('DeviceID'))
  }
  
  public alertmovelogin = [
    {
      text: 'Yes',
      cssClass: 'alert-button-inline',
      handler: () => {
        this.moveToLogin(); 
      }
    },
    {
      text: 'No',
      cssClass: 'alert-button-inline',
    }
  ];


  async movelogin() {
    const alert = await this.alertController.create({
      header: 'ARE YOU SURE TO LOGOUT?', // Main header
      // subHeader: 'COMPLETE THE BIN', // Subheader
      buttons: this.alertmovelogin,
       cssClass: 'custom-alert'
    });

    await alert.present();
  } 
  async moveToLogin() {
    this.storein.stopCam();
    if(this.storein.grndataArr.length>0 || this.storestatus.filteredArray.length>0){
      this.storein.refreshgrn();
    }
    this.router.navigate(['login']);
    let sessionId = localStorage.getItem('session_id') || '1234'; // Replace 'defaultSessionId' with an appropriate default value if necessary
    let data: any = await this.authservice.useLogOut({ 'session_id': JSON.parse(sessionId) });
    if(data.success){
        this.router.navigate(['login']);  
       

    }
  }
}
