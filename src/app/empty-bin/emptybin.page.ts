import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-emptybin',
  templateUrl: './emptybin.page.html',
  styleUrls: ['./emptybin.page.scss'],
})
export class EmptybinPage implements OnInit, AfterViewInit {
  @ViewChild('inputField', { static: false }) inputField!: ElementRef;
  isInputDisabled: boolean = false;

  constructor(
    private alertController: AlertController, 
    private apiservice: ApiService,
    public loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.focusInput();
  }

  ngAfterViewInit(): void {
    this.focusInput();
  }

  // Listen to clicks outside the input box to maintain focus
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!this.inputField.nativeElement.contains(target)) {
      this.focusInput();
    }
  }
 
  private focusInput() {
    if (this.inputField && this.inputField.nativeElement && !this.isInputDisabled) {
      setTimeout(() => {
        this.inputField.nativeElement.focus();
      }, 200);  
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
            this.focusInput();  
          },
        },
      ],
      cssClass: 'custom-alert',
    });

    await alert.present();
  }

  handleClear() {
    this.inputField.nativeElement.value = '';
    this.isInputDisabled = false;  
    this.focusInput();
  }

  async handleSubmit() {
    const inputValue = this.inputField.nativeElement.value;
 
    if (!inputValue || inputValue.trim() === '') {
      this.presentAlert('Please enter bin id');
      return;
    }

    this.isInputDisabled = true;  

    // Call API
    this.loadingService.presentLoading();
    this.apiservice.submitEmptyBinStore({ data: [inputValue] }).subscribe(
      (res: any) => {
        this.loadingService.dismissLoading();
        this.inputField.nativeElement.value = '';  
        this.isInputDisabled = false;  
        this.presentAlert(res.message);
      },
      (error: any) => {
        this.loadingService.dismissLoading()
        this.isInputDisabled = false; 
        this.presentAlert(error.message);
      }
    );
  }
}
