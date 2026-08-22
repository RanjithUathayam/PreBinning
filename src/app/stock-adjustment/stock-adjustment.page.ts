import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { LoadingService } from '../services/loading.service';
import { Router, NavigationEnd } from '@angular/router';



@Component({
  selector: 'app-stock-adjustment',
  templateUrl: './stock-adjustment.page.html',
  styleUrls: ['./stock-adjustment.page.scss'],
})
export class StockAdjustmentPage implements OnInit {
  binId: string = '';
  itemCode: string = '';
  isItemCodeVisible: boolean = false;
  itemAlreadyScanned: any[] = [];

  @ViewChild('binIdInput') binIdInput!: ElementRef;
  @ViewChild('itemCodeInput') itemCodeInput!: ElementRef;
  @ViewChild('scrollContent') scrollContent!: ElementRef;

  grndataArr: any[] = [];
  grndataArrBin: any[] = [];

  constructor(
    private alertController: AlertController,
    private apiservice: ApiService,
    public loadingService: LoadingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.listenForNavigation(); 
  }

  ngAfterViewInit(): void {
    this.setFocusToBinId();
  }

  private listenForNavigation(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setFocusToBinId();
      }
    });
  }

  private setFocusToBinId(): void {
    setTimeout(() => {
      this.binIdInput?.nativeElement.focus();
    }, 100);
  }

  onBinIdScanned() {
    if (!this.binId.trim()) {
      this.presentAlert('Enter Valid Bin ID');
      return;
    }
  
    const obj = { BinID: this.binId };
    this.loadingService.presentLoading();
    this.apiservice.getBinIdInfoForRefilling(obj).subscribe(
      (response: any) => {
        this.loadingService.dismissLoading();
        if (response.status === 1) {
          this.grndataArrBin = response.data;
          this.grndataArr = [...response.data];
          this.grndataArr = this.grndataArr.map(item => ({ ...item, ScannedQty: 0 }));
          if (this.grndataArr.length > 0) {
            this.isItemCodeVisible = true;
          } else {
            this.presentAlert('No data found for the given Bin ID.');
            this.binId = '';
          }
          setTimeout(() => {
            this.itemCodeInput?.nativeElement.focus();
          }, 100);
        } else {
          this.presentAlert('No data found for the given Bin ID.');
        }
      },
      (error) => {
        this.loadingService.dismissLoading();
        this.presentAlert('Error while fetching data.');
      }
    );
  }
  
  addItem() {
    if (!this.itemCode.includes('|')) {
      this.convertScanToBinId();
      this.itemCode = '';
      return;
    } 

    const scannedData = this.itemCode.split('|');
    const scannedItemCode = scannedData[0];
    const scannedItemGroup = scannedData[3];
    const scannedQuantity = parseInt(scannedData[5], 10);
  
    if (!scannedItemCode || !scannedItemGroup || !scannedQuantity) {
      this.presentAlert('ENTER VALID ITEM CODE');
      this.itemCode = '';
      return;
    }
  
    if (this.grndataArr.length > 0) {
      const allowedGroup = this.grndataArr[0].ItemGroup;
      if (scannedItemGroup !== allowedGroup) {
        this.presentAlert('ITEM GROUP MISMATCH');
        this.itemCode = '';
        return;
      }

      const bincapacity = this.grndataArrBin[0].BinCapacity;
      const currentTotalQuantity = this.grndataArr.reduce((total, item) => total + item.ScannedQty, 0);
      const newTotalQuantity = currentTotalQuantity + scannedQuantity;
      if (newTotalQuantity > bincapacity) {
        this.presentAlert(`BIN LIMIT REACHED`);
        this.itemCode = '';
        return;
      }
    }
  
    if (this.itemAlreadyScanned.includes(this.itemCode)) {
      this.presentAlert('ITEM ALREADY SCANNED');
      this.itemCode = '';
      return;
    }
    this.itemAlreadyScanned.push(this.itemCode);
  
    let existingItem = this.grndataArr.find(item => item.ItemCode === scannedItemCode);
  
    if (existingItem) { 
      existingItem.ScannedQty = (existingItem.ScannedQty || 0) + scannedQuantity;
      existingItem.isHighlighted = true;
    } else {
      const existingItemInBin = this.grndataArrBin.find(item => item.ItemCode === scannedItemCode);
  
      if (existingItemInBin) {
        this.grndataArr.unshift({
          ItemCode: existingItemInBin.ItemCode,
          ItemName: existingItemInBin.ItemName,
          ItemGroup: existingItemInBin.ItemGroup, 
          AvlQty: existingItemInBin.Quantity,
          ScannedQty: scannedQuantity,
          Count: 1,
          GRNStatus: 'Pending',
          isHighlighted: true,
        });
      } else {
        this.grndataArr.unshift({
          ItemCode: scannedItemCode,
          ItemName: 'New Item',
          ItemGroup: scannedItemGroup, 
          AvlQty: 0,
          Quantity: 0,
          ScannedQty: scannedQuantity,  
          Count: 1,
          GRNStatus: 'Pending',
          isHighlighted: true,
        });
      }
    }

    console.log('Grn Data : ', this.grndataArr);
  
    this.itemCode = '';
    this.itemCodeInput?.nativeElement.focus();
    this.scrollUp();
  }
  
  
  
  convertScanToBinId() {
    console.log('Bin ID : ', this.binId);
      this.alertchange();
  }

  async alertchange() { 
    const alert = await this.alertController.create({
      header: 'D0 YOU WANT TO CHANGE THE BIN ID?',
      buttons: this.alertButtonsconvertBin,
      cssClass: 'custom-alert',
      backdropDismiss: false
    });
    await alert.present();
  } 

  public alertButtonsconvertBin = [
 
    {
        text: 'Yes',
        cssClass: 'alert-button-inline',
        handler: () => {
            this.isItemCodeVisible = false;
            this.binId = '';
            this.setFocusToBinId();
            this.grndataArr = [];
            this.grndataArrBin = [];
            this.itemAlreadyScanned = [];
        }
    },
    {
      text: 'No',
      cssClass: 'alert-button-inline',
      handler: () => {
          // this.setFocusToBinId();
      }
  }
];

// Empty the bin
emptythebin() {
  console.log('Bin ID : ', this.binId);
    this.emptybinalertchange();
}

async emptybinalertchange() { 
  const alert = await this.alertController.create({
    header: 'ARE YOU SURE THE BIN IS EMPTY?',
    buttons: this.alertButtonsEmptyBin,
    cssClass: 'custom-alert',
    backdropDismiss: false
  });
  await alert.present();
} 

public alertButtonsEmptyBin = [

  {
      text: 'Yes',
      cssClass: 'alert-button-inline',
      handler: () => {
        let obj = {
          BinID: this.binId,
          dataArr: this.grndataArr
        }
        this.loadingService.presentLoading();
        this.apiservice.updateStockAdjustmentHHT(obj).subscribe(
          (response: any) => {
            this.loadingService.dismissLoading();
            if (response.status === 1) {
              this.presentAlert(response.message);
              this.binId = '';
              this.itemCode = '';
              this.grndataArr = [];
              this.grndataArrBin = [];
              this.itemAlreadyScanned = [];
              this.isItemCodeVisible = false; 
              this.setFocusToBinId();
            } else {
              this.presentAlert(response.message);
            }
          },
          (error: any) => {
            this.loadingService.dismissLoading();
            this.presentAlert('Error');
          }
        ); 
      }
  },
  {
    text: 'No',
    cssClass: 'alert-button-inline',
    handler: () => {
        // this.setFocusToBinId();
    }
}
];
 
 

  getTotalQty()
  { 
    return this.grndataArr.reduce((total, item) => total + item.Quantity, 0);
  }

  getTotalScannedQty()
  {
    return this.grndataArr.reduce((total, item) => total + item.ScannedQty, 0);
  }
   

  handleSubmit() { 

    if(this.itemAlreadyScanned.length === 0) {
      // this.presentAlert('Please scan atleast one item.');
      this.emptybinalertchange();
      
      return;
    }

    let obj = {
      BinID: this.binId,
      dataArr: this.grndataArr
    }
    this.loadingService.presentLoading();
    this.apiservice.updateStockAdjustmentHHT(obj).subscribe(
      (response: any) => {
        this.loadingService.dismissLoading();
        if (response.status === 1) {
          this.presentAlert(response.message);
          this.binId = '';
          this.itemCode = '';
          this.isItemCodeVisible = false;
          this.grndataArr = [];
          this.grndataArrBin = [];
          this.itemAlreadyScanned = [];
          this.setFocusToBinId();
        } else {
          this.presentAlert(response.message);
        }
      }
    );

    // console.log('Bin ID : ', this.binId);
    // console.log("Grn Data : ", this.grndataArr);
    // if (this.binId && this.itemCode) {
    //   this.addItem();
    // } else {
    //    this.isItemCodeVisible = false;
    //     this.binId = '';
    // }
  }

  scrollUp() {
    const content = this.scrollContent?.nativeElement;
    if (content) {
      content.scrollBy({ top: -content.scrollHeight, behavior: 'smooth' });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(): void {
    if (this.binId.trim()) {
      this.itemCodeInput?.nativeElement.focus();
    } else {
      this.binIdInput?.nativeElement.focus();
    }
  }

  async presentAlert(msg: string) {
    const alert = await this.alertController.create({
      header: msg,
      buttons: [
        {
          text: 'OK',
          cssClass: 'alert-button-confirm',
          handler: () => { 

          },
        },
      ],
      cssClass: 'custom-alert',
    });

    await alert.present();
  }

}
