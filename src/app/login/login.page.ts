import { Router } from '@angular/router';
import { AlertController, Platform } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { Device } from '@capacitor/device';
import { LoadingService } from '../services/loading.service';
import { StoreinPage } from '../storein/storein.page';
declare var Android: any;
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  userName: any = '';
  pwd: any = '';
  isPasswordVisible: boolean = false;
  deviceId: any;
  deviceIdNew: any;
  deviceInfo: any;
  devicename: any;
  devicemodel: any;
  deviceos: any;
  deviceosversion: any;
  deviceandroidSDKVersion: any;
  deviceInfoNew: any;
  devicenameNew: any;
  devicemodelNew: any;
  deviceosNew: any;
  deviceosversionNew: any;
  deviceandroidSDKVersionNew: any;
  isError: boolean = false;
  appVersionNumber: any = '';
  @ViewChild('mainContent', { static: false }) mainContent: ElementRef | undefined;
  @ViewChild('inputElement', { static: false }) inputElement: ElementRef | undefined;


  loginForm = new FormGroup({
    username: new FormControl(null, [Validators.required]),
    password: new FormControl(null, [Validators.required]),
  });
  
  constructor(private router: Router, private platform: Platform,
    public loadingService: LoadingService, private storein: StoreinPage,
    private apiservice: AuthService, private alertController: AlertController) {
    this.isPasswordVisible = false;
  }


  async ngOnInit() {
    this.getDeviceId();
    this.getDeviceInfo();
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  onLoginIn() {
    try {
      this.isError = false; // Reset the error state
      if (!this.userName) {
        this.isError = true; // Set error state if username is empty
      } else if (!this.pwd) {
        this.isError = true; // Set error state if password is empty
      } else {
        this.loadingService.presentLoading();
        let loginObj = {
          username: this.userName,
          password: this.pwd,
          deviceId: this.deviceIdNew,
          deviceModel: this.devicemodelNew,
          deviceOS: this.deviceosNew,
          deviceOSVersion: this.deviceosversionNew
        };
        this.apiservice?.login(loginObj).subscribe((res: any) => {
          if (res.status === 1) {
            this.userName = '';
            this.pwd = '';
            localStorage.setItem('Token', res.token);
            localStorage.setItem('DeviceID', res.DeviceID);
            localStorage.setItem('session_id', JSON.stringify(res['sessionData']));
            this.storein.refreshgrn();
            this.router.navigate(['/dashboard']);
          } else {
            this.presentAlert(res.message, 'danger');
          }
          this.loadingService.dismissLoading();
        }, (err: any) => {
          this.presentAlert('Login failed', 'danger');
          this.loadingService.dismissLoading();
        });
      }
    } catch (error) {
      this.presentAlert('Login failed', 'danger');
    }
  }

  async exit() {
    const alert = await this.alertController.create({
      header: 'Are you sure want to Exit?',
      buttons: this.alertExitButtons,
      cssClass: 'custom-alert'
    });
    await alert.present();
  }


  public alertExitButtons = [
    {
      text: 'YES',
      cssClass: 'alert-button-inline',
      handler: () => {
        if (typeof Android !== 'undefined' && Android !== null) {
          Android.closeApp();
        }
      }
    },
    {
      text: 'NO',
      cssClass: 'alert-button-inline',
      role: 'cancel'
    }
  ];

  async presentAlert(msg: any, color: any) {
    const alert = await this.alertController.create({
      header: msg,
      buttons: this.alertPresentButtons,
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  public alertPresentButtons = [
    {
      text: 'OK',
      cssClass: 'alert-button-confirm',
      handler: () => {
        //this.loginForm.reset();
        this.userName = ''; 
        this.pwd = ''; 
      }
    }
  ];


  async getDeviceInfo() {
    try {
      const info = await Device.getInfo();
      this.deviceInfo = info;
      localStorage.setItem('deviceName', this.deviceInfo.name);
      localStorage.setItem('deviceModel', this.deviceInfo.model);
      localStorage.setItem('deviceOS', this.deviceInfo.operatingSystem);
      localStorage.setItem('deviceOSVERSION', this.deviceInfo.osVersion);
      localStorage.setItem('deviceAndroidSDKVersion', this.deviceInfo.androidSDKVersion);
      this.getStoredDeviceInfo();
    } catch (error) {
      //console.error('Error getting device info:', error);
    }
  }

  async getDeviceId() {
    try {
      const info = await Device.getId();
      this.deviceId = info;
      localStorage.setItem('deviceId', this.deviceId.identifier);
      this.getStoredDeviceId();
    } catch (error) {
      //console.error('Error getting device ID:', error);
    }
  }

  getStoredDeviceId() {
    try {
      const storedDeviceId = localStorage.getItem('deviceId');
      if (storedDeviceId) {
        this.deviceIdNew = storedDeviceId;
      } else {
       // console.warn('No Device ID found in local storage.');
      }
    } catch (error) {
     // console.error('Error retrieving Device ID from local storage:', error);
    }
  }

  getStoredDeviceInfo() {
    try {
      const storedDeviceName = localStorage.getItem('deviceName');
      const storedDeviceModel = localStorage.getItem('deviceModel');
      const storedDeviceOS = localStorage.getItem('deviceOS');
      const storedDeviceOSversion = localStorage.getItem('deviceOSVERSION');
      const storedDeviceAndroidSDKVersion = localStorage.getItem('deviceAndroidSDKVersion');
      if (storedDeviceName) {
        this.devicenameNew = storedDeviceName;
        this.devicemodelNew = storedDeviceModel;
        this.deviceosNew = storedDeviceOS;
        this.deviceosversionNew = storedDeviceOSversion;
        this.deviceandroidSDKVersionNew = storedDeviceAndroidSDKVersion;
      } 
      else {
        //console.warn('No Device Info found in local storage.');
      }
    } catch (error) {
     // console.error('Error retrieving Device Info from local storage:', error);
    }
  }

}

  