import { Component, HostListener, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AlertController } from '@ionic/angular';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-storestatus',
  templateUrl: './storestatus.page.html',
  styleUrls: ['./storestatus.page.scss'],
})
export class StoreStausPage implements OnInit {

  constructor(private apiService : ApiService,private alertController: AlertController, private loadingService: LoadingService) { }
  
  filteredArray : any[] = []   // to get the api data
  dropdownVisible = false;
  expandedItem: any = null;
  grndataArr : any[] = []     
  ngOnInit() {
    this.getGrnStatus()
  }


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
    }
  }
]

  getGrnStatus() {
    this.loadingService.presentLoading();
    this.apiService.GetGrnListDataStatus().subscribe(
        (res: any) => {
            this.loadingService.dismissLoading();
            if (res && res.status === 1) {
                this.filteredArray = res.data;  // Store the data from the API in filteredArray
            } else {
              this.presentAlert(res.message, '')
            }
        },
        (error: any) => {
          this.loadingService.dismissLoading();
          this.presentAlert(error.message, '')  // Handle network or server error here
        }
    );
}


  toggleDropdown(): void {
    this.dropdownVisible = !this.dropdownVisible;
  }
  
  @HostListener('window:click', ['$event'])
  onWindowClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropbtn')) {
      this.dropdownVisible = false;
    }
  }

  toggleExpand(item: any): void {
    this.expandedItem = this.expandedItem === item ? null : item;
}

getGRNDetails(grnNp: any) {
    this.loadingService.presentLoading();
  this.apiService.SendSelectedGrn(grnNp).subscribe(
      (res: any) => {
        this.loadingService.dismissLoading();
          if (res && res.status === 1) {
              this.grndataArr = res.data;  // Store the data from the API in grndataArr
          } else {
            this.presentAlert(res.message, '')
          }
      },
      (error: any) => {
        this.loadingService.dismissLoading();
        this.presentAlert(error.message, '')
      }
  );
}


  getBackgroundColor(status: string): string {
    switch (status) {
      case 'Pending':
        return 'red'; 
      case 'Completed':
        return 'green';
      case 'InProgress':
        return 'yellow'; 
      default:
        return 'lightblue';
    }
  }
  getInnerCircleColor(status: string): string {
    switch (status) {
      case 'Pending':
        return 'white'; 
      case 'Completed':
        return 'white'; 
      case 'InProgress':
        return 'white'; 
      default:
        return 'white'; 
    }
  }
  
}
