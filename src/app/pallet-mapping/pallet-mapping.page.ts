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
        const palletId = (rawValue || '').trim();
        if (this.scanning || !palletId) {
            return;
        }

        if (this.isPalletScanned) {
            return;
        }

        this.scanning = true;
        this.palletMappingApi.validatePallet({ palletId }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    const data = res.data || {};
                    this.applyMapping(data, palletId);
                    this.isPalletScanned = true;
                    if (this.currentPalletBoxes.length > 0) {
                        this.setValidation('success', `Pallet ${this.palletId} already has ${this.currentPalletBoxes.length} box(es) mapped. Continue scanning to add more.`);
                    } else {
                        this.setValidation('success', `Pallet ${this.palletId} scanned successfully.`);
                    }
                    this.boxScanSection?.focusInput();
                } else {
                    this.setValidation('error', this.messageForPalletError(res, palletId), () => this.palletScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                this.setValidation('error', this.extractErrorMessage(err), () => this.palletScanSection?.focusInput());
            }
        });
    }

    private applyMapping(data: any, fallbackPalletId: string) {
        this.palletId = data.palletId || fallbackPalletId;
        this.palletStatus = data.status || 'OPEN';
        this.currentPalletBoxes = (data.boxes || []).map((b: any) => ({
            boxNumber: b.boxNumber,
            warehouseCode: b.warehouseCode,
            itemGroup: b.itemGroup,
            boxTotalQty: b.boxTotalQty,
            mappedBy: b.mappedBy,
            mappedAt: b.mappedAt
        }));
    }

    private messageForPalletError(res: any, palletId: string): string {
        switch (res?.code) {
            case 'PALLET_ALREADY_COMPLETED':
                return res?.message || `Pallet ${palletId} has already been completed and cannot be reused.`;
            default:
                return res?.message || 'Invalid Pallet QR.';
        }
    }

    onBoxScanned(rawValue: string) {
        const boxNumber = (rawValue || '').trim();
        if (this.scanning || !boxNumber) {
            return;
        }

        if (!this.isPalletScanned || !this.palletId) {
            this.setValidation('error', 'Please scan Pallet ID first.', () => this.palletScanSection?.focusInput());
            return;
        }

        const isDuplicateLocal = this.currentPalletBoxes.some((b) => b.boxNumber.toUpperCase() === boxNumber.toUpperCase());
        if (isDuplicateLocal) {
            this.setValidation('error', `Box ${boxNumber} is already scanned in this pallet.`, () => this.boxScanSection?.focusInput());
            return;
        }

        this.scanning = true;
        this.palletMappingApi.addBox({ palletId: this.palletId, boxNumber }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    this.applyMapping(res.data || {}, this.palletId as string);
                    this.showToast(`Box ${boxNumber} mapped successfully.`, 'success');
                    this.setValidation('success', 'Box mapped successfully.');
                    this.boxScanSection?.focusInput();
                } else {
                    this.setValidation('error', this.messageForBoxError(res, boxNumber), () => this.boxScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                this.setValidation('error', this.extractErrorMessage(err), () => this.boxScanSection?.focusInput());
            }
        });
    }

    private messageForBoxError(res: any, boxNumber: string): string {
        switch (res?.code) {
            case 'BOX_ALREADY_MAPPED':
                return res?.message || `Box ${boxNumber} is already mapped to another pallet.`;
            case 'BOX_NOT_ELIGIBLE':
                return res?.message || `Box ${boxNumber} has not completed Pre-Binning yet.`;
            case 'BOX_NOT_FOUND':
                return res?.message || `Box ${boxNumber} was not found.`;
            case 'PALLET_NOT_OPEN':
                return res?.message || 'No open pallet mapping found. Validate the pallet first.';
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
}
