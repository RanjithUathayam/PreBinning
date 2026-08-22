import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  isLoading = false;
  private loading: HTMLIonLoadingElement | null = null;
  constructor(private loadingController: LoadingController) { }

  async presentLoading() {
    this.isLoading = true;
    return await this.loadingController.create({
      cssClass: 'loader-css-class',
      message: 'Please wait...',
      translucent: true,
      showBackdrop: false,
      spinner: 'bubbles',
    }).then(a => {
      a.present().then(() => {
        if (!this.isLoading) {
          a.dismiss().then(() => console.log('abort presenting'));
        }
      });
    });
  }

  async dismissLoading() {
    this.isLoading = false;
    return await this.loadingController.dismiss().then(() => console.log('dismissed'));
  }
}
