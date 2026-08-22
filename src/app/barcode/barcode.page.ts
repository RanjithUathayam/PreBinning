import { Component, OnInit } from '@angular/core';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { Html5QrcodeError, Html5QrcodeResult } from 'html5-qrcode/esm/core';

@Component({
  selector: 'app-barcode',
  templateUrl: './barcode.page.html',
  styleUrls: ['./barcode.page.scss'],
})
export class BarcodePage implements OnInit {
  private html5Qrcode: Html5Qrcode | null = null;
  camSet: number = 0;

  ngOnInit(): void {
   
  }

  openCam(): void {
    this.camSet = 1;

    const reader = document.getElementById('reader');
    const arrange = document.getElementById('arrange');

    if (reader) {
      reader.style.display = 'block';
    }
    if (arrange) {
      arrange.style.display = 'grid';
    }

    this.html5Qrcode = new Html5Qrcode('reader');
    
    const qrCodeSuccessCallback = (decodedText: string, decodedResult: Html5QrcodeResult) => {
      const showElement = document.getElementById('show');
      const resultElement = document.getElementById('result');
 
      if (showElement && resultElement) {
        showElement.style.display = 'block';
        resultElement.textContent = (decodedText);
        this.html5Qrcode?.stop().then(() => {
        }).catch((err) => {
          console.error("Failed to stop scanning: ", err);
        });
      }
    };

    const qrCodeErrorCallback = (errorMessage: string, error: Html5QrcodeError) => {
      // Log the error message
      // console.error(`QR code parse error: ${errorMessage}`);
      // Continue scanning without interruption
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    this.html5Qrcode.start(
      { facingMode: "environment" }, 
      config, 
      qrCodeSuccessCallback, 
      qrCodeErrorCallback
    ).then(() => {
    }).catch((err) => {
      console.error("Failed to start scanning: ", err);
    });
  }

  stopCam(): void {
    if (this.html5Qrcode) {
      this.html5Qrcode.stop().then(() => {
        const reader = document.getElementById('reader');
        if (reader) {
          reader.style.display = 'none';
        }
      }).catch((err: any) => {
        console.error("Failed to stop scanning: ", err);
      });
    }
  }

}
