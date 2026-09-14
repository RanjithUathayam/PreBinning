import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { PickingApiService } from './services/picking-api.service';
import { PickItemLine } from './picking.types';
import { PickingPalletScanSectionComponent } from './components/pallet-scan-section/pallet-scan-section.component';
import { PickingBoxScanSectionComponent } from './components/box-scan-section/box-scan-section.component';

const ERROR_CODE_MESSAGES: { [code: string]: string } = {
    MISSING_FIELDS: 'Required information is missing. Please rescan and try again.',
    INVALID_PICKED_QUANTITY: 'Picked quantity is invalid. It must be greater than 0 and not exceed the pickable quantity.',
    PALLET_NOT_FOUND: 'Pallet was not found.',
    PALLET_NOT_AVAILABLE: 'This pallet is not available for picking.',
    BOX_NOT_FOUND: 'Box was not found.',
    BOX_NOT_IN_PALLET: 'This box does not belong to the scanned pallet.',
    ITEM_NOT_FOUND: 'Item was not found in the selected box.',
    BOX_ALREADY_PICKED: 'This item/box has already been fully picked.',
    INSUFFICIENT_INVENTORY: 'Insufficient available quantity for this pick.'
};

@Component({
    selector: 'app-picking',
    templateUrl: './picking.page.html',
    styleUrls: ['./picking.page.scss'],
})
export class PickingPage implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild(PickingPalletScanSectionComponent) palletScanSection!: PickingPalletScanSectionComponent;
    @ViewChild(PickingBoxScanSectionComponent) boxScanSection!: PickingBoxScanSectionComponent;

    // header context
    currentUser: string = localStorage.getItem('UserName') || 'N/A';
    selectedStation: string = localStorage.getItem('DeviceID') || 'N/A';
    currentDateTime: Date = new Date();
    private clockTimer: any;

    // current pallet
    palletMappingId: number | null = null;
    palletId: string | null = null;
    palletNumber: string | null = null;
    palletStatus = '';
    pickingStatus = '';
    isPalletScanned = false;
    boxNumbers: string[] = [];
    items: PickItemLine[] = [];

    // current box
    currentBoxNumber: string | null = null;
    currentBoxItems: PickItemLine[] = [];
    currentBoxRemainingQty: number | null = null;
    currentBoxPickingStatus: string | null = null;

    // scan / validation state
    scanning = false;
    validationMessage = '';
    validationLevel: 'success' | 'error' | 'warning' | '' = '';

    constructor(
        private pickingApi: PickingApiService,
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

    get pickedItemCount(): number {
        return this.items.filter((i) => i.pickingStatus === 'PICKED').length;
    }

    onPalletScanned(rawValue: string) {
        const palletNumber = (rawValue || '').trim();
        if (this.scanning || !palletNumber) {
            return;
        }

        if (this.isPalletScanned) {
            return;
        }

        this.scanning = true;
        this.pickingApi.scanPallet({ palletNumber }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    this.applyPalletData(res.data || {}, palletNumber);
                    this.isPalletScanned = true;
                    this.setValidation('success', `Pallet ${this.palletNumber} scanned successfully. ${this.pickedItemCount} of ${this.items.length} item(s) already picked.`);
                    this.boxScanSection?.focusInput();
                } else {
                    this.setValidation('error', this.messageForCode(res?.code, res?.message), () => this.palletScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                this.setValidation('error', this.extractErrorMessage(err), () => this.palletScanSection?.focusInput());
            }
        });
    }

    private applyPalletData(data: any, fallbackPalletNumber: string) {
        this.palletMappingId = data.palletMappingId ?? null;
        this.palletId = data.palletId ?? null;
        this.palletNumber = data.palletNumber || fallbackPalletNumber;
        this.palletStatus = data.palletStatus || '';
        this.pickingStatus = data.pickingStatus || 'PENDING';
        this.boxNumbers = data.boxNumbers || [];
        this.items = data.items || [];
    }

    onBoxScanned(rawValue: string) {
        const boxNumber = (rawValue || '').trim();
        if (this.scanning || !boxNumber) {
            return;
        }

        if (!this.isPalletScanned || !this.palletNumber) {
            this.setValidation('error', 'Please scan the Pallet Number first.', () => this.palletScanSection?.focusInput());
            return;
        }

        if (this.boxNumbers.length > 0 && !this.boxNumbers.some((b) => b.toUpperCase() === boxNumber.toUpperCase())) {
            this.setValidation('error', this.messageForCode('BOX_NOT_IN_PALLET'), () => this.boxScanSection?.focusInput());
            return;
        }

        this.scanning = true;
        this.pickingApi.scanBox({ palletNumber: this.palletNumber, boxNumber }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    this.applyBoxData(res.data || {}, boxNumber);
                    this.setValidation('success', `Box ${this.currentBoxNumber} ready for picking.`);
                } else {
                    this.setValidation('error', this.messageForCode(res?.code, res?.message), () => this.boxScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                this.setValidation('error', this.extractErrorMessage(err), () => this.boxScanSection?.focusInput());
            }
        });
    }

    private applyBoxData(data: any, fallbackBoxNumber: string) {
        this.currentBoxNumber = data.boxNumber || fallbackBoxNumber;
        this.currentBoxItems = data.items || [];
        this.currentBoxRemainingQty = null;
        this.currentBoxPickingStatus = null;
        this.mergeItems(this.currentBoxItems);
    }

    /** Keeps the pallet-wide items list in sync with the latest known state of each item line. */
    private mergeItems(updated: PickItemLine[]) {
        if (!updated || updated.length === 0) {
            return;
        }
        const byId = new Map(updated.map((i) => [i.inventoryId, i]));
        this.items = this.items.map((existing) => byId.get(existing.inventoryId) || existing);
        updated.forEach((u) => {
            if (!this.items.some((i) => i.inventoryId === u.inventoryId)) {
                this.items = [...this.items, u];
            }
        });
    }

    async onPickItem(event: { item: PickItemLine; pickedQuantity: number }) {
        const { item, pickedQuantity } = event;
        if (this.scanning || !this.palletNumber || !this.currentBoxNumber) {
            return;
        }
        if (!Number.isFinite(pickedQuantity) || pickedQuantity <= 0 || pickedQuantity > item.pickableQty) {
            this.setValidation('error', this.messageForCode('INVALID_PICKED_QUANTITY'));
            return;
        }

        const alert = await this.alertController.create({
            header: 'ARE YOU SURE TO COMPLETE PICKING?',
            message: `Item ${item.itemCode} — Qty ${pickedQuantity} from Box ${this.currentBoxNumber}.`,
            buttons: [
                { text: 'Yes', cssClass: 'alert-button-inline', handler: () => this.confirmCompletePicking(item, pickedQuantity) },
                { text: 'No', cssClass: 'alert-button-inline', handler: () => this.boxScanSection?.focusInput() }
            ],
            cssClass: 'custom-alert'
        });
        await alert.present();
    }

    private confirmCompletePicking(item: PickItemLine, pickedQuantity: number) {
        if (!this.palletNumber || !this.currentBoxNumber) {
            return;
        }
        this.scanning = true;
        this.pickingApi.completePicking({
            palletNumber: this.palletNumber,
            boxNumber: this.currentBoxNumber,
            itemCode: item.itemCode,
            pickedQuantity: Number(pickedQuantity)
        }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    this.applyCompletePickingResult(item, res.data || {});
                    this.showToast(`Picked ${res.data?.picking?.pickedQty ?? pickedQuantity} of ${item.itemCode} from Box ${this.currentBoxNumber}.`, 'success');
                    this.setValidation('success', `${this.pickedItemCount} of ${this.items.length} item(s) picked.`);
                } else {
                    this.setValidation('error', this.messageForCode(res?.code, res?.message));
                    this.refreshCurrentBoxSilently();
                }
            },
            error: (err: any) => {
                this.scanning = false;
                this.setValidation('error', this.extractErrorMessage(err));
                if (err?.error?.code === 'BOX_ALREADY_PICKED' || err?.error?.code === 'INSUFFICIENT_INVENTORY' || err?.status === 409) {
                    this.refreshCurrentBoxSilently();
                }
            }
        });
    }

    private applyCompletePickingResult(item: PickItemLine, data: any) {
        const picking = data.picking || {};
        const pallet = data.pallet || {};
        const box = data.box || {};

        const updated: PickItemLine = {
            ...item,
            pickableQty: picking.remainingQty ?? item.pickableQty,
            pickingStatus: picking.status || item.pickingStatus
        };
        this.mergeItems([updated]);
        this.currentBoxItems = this.currentBoxItems.map((i) => i.inventoryId === updated.inventoryId ? updated : i);

        if (pallet.pickingStatus) {
            this.pickingStatus = pallet.pickingStatus;
        }
        if (box.remainingQty !== undefined) {
            this.currentBoxRemainingQty = box.remainingQty;
        }
        if (box.pickingStatus) {
            this.currentBoxPickingStatus = box.pickingStatus;
        }
    }

    /** Re-syncs the current box from the backend after a conflicting/failed pick, without disturbing scan focus or showing extra banners. */
    private refreshCurrentBoxSilently() {
        if (!this.palletNumber || !this.currentBoxNumber) {
            return;
        }
        this.pickingApi.scanBox({ palletNumber: this.palletNumber, boxNumber: this.currentBoxNumber }).subscribe({
            next: (res: any) => {
                if (res && res.success) {
                    this.applyBoxData(res.data || {}, this.currentBoxNumber as string);
                }
            },
            error: () => { }
        });
    }

    async changePallet() {
        if (!this.isPalletScanned) {
            return;
        }
        const alert = await this.alertController.create({
            header: 'SCAN A DIFFERENT PALLET?',
            message: 'This will clear the current pallet view. Already picked items are not affected.',
            buttons: [
                { text: 'Yes', cssClass: 'alert-button-inline', handler: () => this.resetPallet() },
                { text: 'No', cssClass: 'alert-button-inline', handler: () => this.boxScanSection?.focusInput() }
            ],
            cssClass: 'custom-alert'
        });
        await alert.present();
    }

    private resetPallet() {
        this.palletMappingId = null;
        this.palletId = null;
        this.palletNumber = null;
        this.palletStatus = '';
        this.pickingStatus = '';
        this.isPalletScanned = false;
        this.boxNumbers = [];
        this.items = [];
        this.currentBoxNumber = null;
        this.currentBoxItems = [];
        this.currentBoxRemainingQty = null;
        this.currentBoxPickingStatus = null;
        this.validationMessage = '';
        this.validationLevel = '';
        this.palletScanSection?.focusInput();
    }

    private messageForCode(code?: string, message?: string): string {
        if (code && ERROR_CODE_MESSAGES[code]) {
            return ERROR_CODE_MESSAGES[code];
        }
        return message || 'Something went wrong.';
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
        const code = err?.error?.code;
        if (code && ERROR_CODE_MESSAGES[code]) {
            return ERROR_CODE_MESSAGES[code];
        }
        if (err?.error?.message) {
            return err.error.message;
        }
        if (err?.status === 401) {
            return 'Unauthorized. Please log in again.';
        }
        if (err?.status === 403) {
            return 'You do not have permission to perform this action.';
        }
        if (err?.status === 0) {
            return 'Network error. Please check your connection. This item has not been marked as picked.';
        }
        return 'Something went wrong.';
    }
}
