import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { PalletMappingApiService } from './services/pallet-mapping-api.service';
import { CurrentPalletBox } from './pallet-mapping.types';
import { PalletScanSectionComponent } from './components/pallet-scan-section/pallet-scan-section.component';
import { BoxScanSectionComponent } from './components/box-scan-section/box-scan-section.component';

@Component({
    selector: 'app-pallet-mapping',
    templateUrl: './pallet-mapping.page.html',
    styleUrls: ['./pallet-mapping.page.scss'],
})
export class PalletMappingPage implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild(PalletScanSectionComponent) palletScanSection!: PalletScanSectionComponent;
    @ViewChild(BoxScanSectionComponent) boxScanSection!: BoxScanSectionComponent;

    // header context
    currentUser: string = localStorage.getItem('UserName') || 'N/A';
    selectedStation: string = localStorage.getItem('DeviceID') || 'N/A';
    currentDateTime: Date = new Date();
    private clockTimer: any;

    // current pallet
    palletId: string | null = null;
    palletStatus = '';
    isPalletScanned = false;
    currentPalletBoxes: CurrentPalletBox[] = [];

    // scan / validation state
    scanning = false;
    validationMessage = '';
    validationLevel: 'success' | 'error' | 'warning' | '' = '';

    constructor(
        private palletMappingApi: PalletMappingApiService,
        private alertController: AlertController,
        private toastController: ToastController
    ) { }

    ngOnInit(): void {
        this.clockTimer = setInterval(() => this.currentDateTime = new Date(), 1000);
    }

    ngOnDestroy(): void {
        if (this.clockTimer) {
            clearInterval(this.clockTimer);
        }
    }

    ngAfterViewInit(): void {
        this.palletScanSection?.focusInput();
    }

    onPalletScanned(rawValue: string) {
        const palletQr = (rawValue || '').trim();
        if (this.scanning || !palletQr) {
            return;
        }

        if (this.isPalletScanned) {
            return;
        }

        this.scanning = true;
        this.palletMappingApi.validatePallet({ palletQr }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    const data = res.data || {};
                    this.palletId = data.palletId || palletQr;
                    this.palletStatus = data.status || 'IN PROGRESS';
                    this.isPalletScanned = true;
                    this.currentPalletBoxes = [];
                    this.setValidation('success', `Pallet ${this.palletId} scanned successfully.`);
                    this.loadPalletBoxes(this.palletId as string);
                    this.boxScanSection?.focusInput();
                } else {
                    this.setValidation('error', res?.message || 'Invalid Pallet QR.', () => this.palletScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                this.setValidation('error', this.extractErrorMessage(err), () => this.palletScanSection?.focusInput());
            }
        });
    }

    loadPalletBoxes(palletId: string) {
        this.palletMappingApi.getPalletBoxes(palletId).subscribe({
            next: (res: any) => {
                if (res && res.success && res.data) {
                    this.currentPalletBoxes = (res.data.boxes || []).map((b: any) => ({
                        boxNumber: b.boxNumber,
                        scanTime: b.scanTime || '',
                        status: b.status || 'MAPPED'
                    }));
                    if (this.currentPalletBoxes.length > 0) {
                        this.setValidation('success', `Pallet ${palletId} already has ${this.currentPalletBoxes.length} box(es) mapped. Continue scanning to add more.`);
                    }
                }
            },
            error: () => {
                // non-fatal: backend couldn't return the resumed box list, keep locally tracked (empty) pallet state
            }
        });
    }

    onBoxScanned(rawValue: string) {
        const boxQr = (rawValue || '').trim();
        if (this.scanning || !boxQr) {
            return;
        }

        if (!this.isPalletScanned || !this.palletId) {
            this.setValidation('error', 'Please scan Pallet ID first.', () => this.palletScanSection?.focusInput());
            return;
        }

        const isDuplicateLocal = this.currentPalletBoxes.some((b) => b.boxNumber.toUpperCase() === boxQr.toUpperCase());
        if (isDuplicateLocal) {
            this.setValidation('error', `Box ${boxQr} is already scanned in this pallet.`, () => this.boxScanSection?.focusInput());
            return;
        }

        this.scanning = true;
        this.palletMappingApi.scanBox({ palletId: this.palletId, boxQr }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    const data = res.data || {};
                    const boxNumber = data.boxNumber || boxQr;
                    this.currentPalletBoxes = [...this.currentPalletBoxes, {
                        boxNumber,
                        scanTime: this.formatTime(new Date()),
                        status: data.status || 'MAPPED'
                    }];
                    this.showToast(`Box ${boxNumber} mapped successfully.`, 'success');
                    this.setValidation('success', 'Box mapped successfully.');
                    this.boxScanSection?.focusInput();
                } else {
                    this.setValidation('error', this.messageForBoxError(res, boxQr), () => this.boxScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                this.setValidation('error', this.extractErrorMessage(err), () => this.boxScanSection?.focusInput());
            }
        });
    }

    private messageForBoxError(res: any, boxQr: string): string {
        switch (res?.code) {
            case 'BOX_ALREADY_MAPPED':
                return res?.message || `Box ${boxQr} is already mapped to another pallet.`;
            case 'DUPLICATE_BOX_IN_PALLET':
                return res?.message || `Box ${boxQr} is already scanned in this pallet.`;
            case 'BOX_NOT_ELIGIBLE':
                return res?.message || `Box ${boxQr} is not eligible for pallet mapping.`;
            case 'INVALID_BOX':
                return res?.message || `Invalid Box QR: ${boxQr}.`;
            default:
                return res?.message || 'Box scan failed.';
        }
    }

    async completePallet() {
        if (!this.isPalletScanned || !this.palletId) {
            return;
        }
        if (this.currentPalletBoxes.length === 0) {
            this.setValidation('error', 'Scan at least one box before completing the pallet.', () => this.boxScanSection?.focusInput());
            return;
        }

        const alert = await this.alertController.create({
            header: 'ARE YOU SURE TO COMPLETE THIS PALLET?',
            message: `Pallet ${this.palletId} has ${this.currentPalletBoxes.length} box(es) mapped.`,
            buttons: [
                { text: 'Yes', cssClass: 'alert-button-inline', handler: () => this.confirmCompletePallet() },
                { text: 'No', cssClass: 'alert-button-inline', handler: () => this.boxScanSection?.focusInput() }
            ],
            cssClass: 'custom-alert'
        });
        await alert.present();
    }

    private confirmCompletePallet() {
        if (!this.palletId) {
            return;
        }
        this.scanning = true;
        this.palletMappingApi.completePallet({ palletId: this.palletId }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    this.showToast(`Pallet ${this.palletId} completed successfully.`, 'success');
                    this.resetPallet();
                } else {
                    this.setValidation('error', res?.message || 'Failed to complete pallet.', () => this.boxScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                this.setValidation('error', this.extractErrorMessage(err), () => this.boxScanSection?.focusInput());
            }
        });
    }

    async cancelPallet() {
        if (!this.isPalletScanned) {
            return;
        }
        const alert = await this.alertController.create({
            header: 'ARE YOU SURE TO CANCEL THIS PALLET?',
            message: `Pallet ${this.palletId} and its ${this.currentPalletBoxes.length} scanned box(es) will not be saved.`,
            buttons: [
                { text: 'Yes, Cancel', cssClass: 'alert-button-inline', handler: () => this.resetPallet() },
                { text: 'No', cssClass: 'alert-button-inline', handler: () => this.boxScanSection?.focusInput() }
            ],
            cssClass: 'custom-alert'
        });
        await alert.present();
    }

    private resetPallet() {
        this.palletId = null;
        this.palletStatus = '';
        this.isPalletScanned = false;
        this.currentPalletBoxes = [];
        this.validationMessage = '';
        this.validationLevel = '';
        this.palletScanSection?.focusInput();
    }

    private setValidation(level: 'success' | 'error' | 'warning', message: string, onDismiss?: () => void) {
        this.validationLevel = level;
        this.validationMessage = message;
        if (level === 'error') {
            this.presentValidationAlert(message, onDismiss);
        }
    }

    private async presentValidationAlert(message: string, onDismiss?: () => void) {
        const alert = await this.alertController.create({
            header: message,
            buttons: [{
                text: 'OK',
                cssClass: 'alert-button-confirm',
                handler: () => { onDismiss?.(); }
            }],
            cssClass: 'custom-alert'
        });
        await alert.present();
    }

    private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
        const toast = await this.toastController.create({ message, duration: 2500, color, position: 'top' });
        await toast.present();
    }

    private extractErrorMessage(err: any): string {
        if (err?.error?.message) {
            return err.error.message;
        }
        if (err?.status === 401) {
            return 'Unauthorized. Please log in again.';
        }
        if (err?.status === 403) {
            return 'You do not have permission to perform this action.';
        }
        if (err?.status === 404) {
            return 'Requested resource was not found.';
        }
        if (err?.status === 409) {
            return 'This pallet/box was just changed by another scanner. Please retry.';
        }
        if (err?.status === 0) {
            return 'Network error. Please check your connection. Your scanned boxes have not been lost.';
        }
        return err?.message || 'Something went wrong.';
    }

    private formatTime(date: Date): string {
        return date.toLocaleTimeString('en-GB', { hour12: false });
    }
}
