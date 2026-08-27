import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { PreBinningApiService } from './services/pre-binning-api.service';
import { CurrentBoxItem, WarehouseOption, WarehouseStockItem, parseItemQr } from './pre-binning.types';
import { BoxScanSectionComponent } from './components/box-scan-section/box-scan-section.component';
import { ItemScanSectionComponent } from './components/item-scan-section/item-scan-section.component';

@Component({
    selector: 'app-pre-binning',
    templateUrl: './pre-binning.page.html',
    styleUrls: ['./pre-binning.page.scss'],
})
export class PreBinningPage implements OnInit, OnDestroy {

    @ViewChild(BoxScanSectionComponent) boxScanSection!: BoxScanSectionComponent;
    @ViewChild(ItemScanSectionComponent) itemScanSection!: ItemScanSectionComponent;

    // header context
    currentUser: string = localStorage.getItem('UserName') || 'N/A';
    selectedStation: string = localStorage.getItem('DeviceID') || 'N/A';
    currentDateTime: Date = new Date();
    private clockTimer: any;

    // warehouse selection (step 1 — mandatory before anything else)
    warehouseList: WarehouseOption[] = [];
    loadingWarehouses = false;
    warehouseDropdownSelection: string | null = localStorage.getItem('PreBinningWarehouseCode') || null;
    selectedWarehouse: string | null = null;
    selectedWarehouseName: string | null = null;
    isWarehouseSelected = false;

    // warehouse stock
    warehouseStock: WarehouseStockItem[] = [];
    isLoading = false;

    // current box
    currentBox: string | null = null;
    currentBoxItemGroup: string | null = null;
    currentBoxItems: CurrentBoxItem[] = [];
    currentBoxQty = 0;
    currentBoxStatus = '';
    isBoxScanned = false;
    isBoxCompleted = false;

    // scan / validation state
    scanning = false;
    validationMessage = '';
    validationLevel: 'success' | 'error' | 'warning' | '' = '';

    constructor(
        private preBinningApi: PreBinningApiService,
        private alertController: AlertController,
        private toastController: ToastController
    ) { }

    ngOnInit(): void {
        this.clockTimer = setInterval(() => this.currentDateTime = new Date(), 1000);
        this.loadWarehouses();
    }

    ngOnDestroy(): void {
        if (this.clockTimer) {
            clearInterval(this.clockTimer);
        }
    }

    loadWarehouses() {
        this.loadingWarehouses = true;
        this.preBinningApi.getWarehouses().subscribe({
            next: (res: any) => {
                this.loadingWarehouses = false;
                if (res && res.success) {
                    this.warehouseList = res.data || [];
                } else {
                    this.showToast(res?.message || 'Failed to load warehouse list.', 'danger');
                }
            },
            error: (err: any) => {
                this.loadingWarehouses = false;
                this.showToast(this.extractErrorMessage(err), 'danger');
            }
        });
    }

    formattedWarehouseLabel(): string {
        if (!this.selectedWarehouse) {
            return '';
        }
        return this.selectedWarehouseName ? `${this.selectedWarehouse} - ${this.selectedWarehouseName}` : this.selectedWarehouse;
    }

    continueWithWarehouse() {
        const chosen = this.warehouseDropdownSelection;
        if (!chosen) {
            this.setValidation('error', 'Please select a warehouse before continuing.');
            return;
        }

        const isChangingWarehouse = this.isWarehouseSelected && chosen !== this.selectedWarehouse;

        if (isChangingWarehouse && this.isBoxScanned) {
            if (this.currentBoxItems.length > 0) {
                this.setValidation('error', 'Please complete the current box before changing warehouse.', () => this.itemScanSection?.focusInput());
                return;
            }
            this.confirmWarehouseChange(chosen);
            return;
        }

        this.applySelectedWarehouse(chosen);
    }

    private async confirmWarehouseChange(chosen: string) {
        const alert = await this.alertController.create({
            header: 'A box scanning process is already in progress.',
            message: 'Changing the warehouse will clear the current box process. Do you want to continue?',
            buttons: [
                {
                    text: 'CANCEL',
                    cssClass: 'alert-button-inline',
                    handler: () => { this.warehouseDropdownSelection = this.selectedWarehouse; }
                },
                {
                    text: 'CHANGE WAREHOUSE',
                    cssClass: 'alert-button-inline',
                    handler: () => {
                        this.resetCurrentBox();
                        this.applySelectedWarehouse(chosen);
                    }
                }
            ],
            cssClass: 'custom-alert'
        });
        await alert.present();
    }

    private applySelectedWarehouse(code: string) {
        const warehouse = this.warehouseList.find((w) => w.whsCode === code);
        this.selectedWarehouse = code;
        this.selectedWarehouseName = warehouse ? warehouse.whsName : null;
        this.warehouseDropdownSelection = code;
        this.isWarehouseSelected = true;
        localStorage.setItem('PreBinningWarehouseCode', code);
        this.loadWarehouseStock();
        this.setValidation('success', `Warehouse selected: ${this.formattedWarehouseLabel()}`);
        this.boxScanSection?.focusInput();
    }

    loadWarehouseStock() {
        if (!this.selectedWarehouse) {
            return;
        }
        this.isLoading = true;
        this.preBinningApi.getWarehouseStock({ whsCode: this.selectedWarehouse }).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res && res.success) {
                    this.warehouseStock = res.data || [];
                } else {
                    this.showToast(res?.message || 'Failed to load warehouse stock.', 'danger');
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.showToast(this.extractErrorMessage(err), 'danger');
            }
        });
    }

    onBoxScanned(rawValue: string) {
        const boxQr = (rawValue || '').trim();
        if (this.scanning || !boxQr) {
            return;
        }

        if (!this.isWarehouseSelected || !this.selectedWarehouse) {
            this.setValidation('error', 'Please select a warehouse before continuing.');
            return;
        }

        this.scanning = true;
        this.preBinningApi.validateBox({ boxQr, whsCode: this.selectedWarehouse }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    const data = res.data || {};
                    this.currentBox = data.boxNumber || boxQr;
                    this.currentBoxItemGroup = data.currentItemGroup || null;
                    this.currentBoxStatus = data.status || 'IN PROGRESS';
                    this.currentBoxItems = [];
                    this.currentBoxQty = 0;
                    this.isBoxScanned = true;
                    this.isBoxCompleted = false;
                    this.itemScanSection?.setPreview(null);
                    this.loadBoxItems(this.currentBox as string);
                    this.itemScanSection?.focusInput();
                } else {
                    this.setValidation('error', res?.message || 'Box validation failed.', () => this.boxScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                this.setValidation('error', this.extractErrorMessage(err), () => this.boxScanSection?.focusInput());
            }
        });
    }

    loadBoxItems(boxNumber: string) {
        this.preBinningApi.getBoxItems(boxNumber).subscribe({
            next: (res: any) => {
                if (res && res.success && res.data) {
                    this.currentBoxItemGroup = res.data.itemGroup || this.currentBoxItemGroup;
                    this.currentBoxItems = (res.data.items || []).map((it: any) => ({
                        itemCode: it.itemCode,
                        type: it.type,
                        grnNo: it.grnNo,
                        itemGroup: it.itemGroup,
                        uniqueNumber: String(it.uniqueNumber),
                        qty: it.qty,
                        scanTime: it.scanTime || ''
                    }));
                    // Prefer the backend's totalQty, but fall back to summing the resumed
                    // items so a box being re-scanned never shows a stale/zero quantity.
                    const computedQty = this.currentBoxItems.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
                    this.currentBoxQty = res.data.totalQty ?? computedQty;

                    if (this.currentBoxItems.length > 0) {
                        this.setValidation('success', `Box ${boxNumber} already has ${this.currentBoxItems.length} item(s) scanned — Existing Qty: ${this.currentBoxQty}, Item Group: ${this.currentBoxItemGroup}. Continue scanning to add more.`);
                    } else {
                        this.setValidation('success', `Box ${boxNumber} ready for item scanning.`);
                    }
                } else {
                    this.setValidation('success', `Box ${boxNumber} ready for item scanning.`);
                }
            },
            error: () => {
                // non-fatal: backend couldn't return the resumed item list, keep locally tracked (empty) box state
                this.setValidation('success', `Box ${boxNumber} ready for item scanning.`);
            }
        });
    }

    onItemScanned(rawValue: string) {
        const raw = (rawValue || '').trim();
        if (this.scanning || !raw) {
            return;
        }

        if (!this.isBoxScanned || !this.currentBox) {
            this.setValidation('error', 'Please scan Box QR first.', () => this.boxScanSection?.focusInput());
            return;
        }

        const parsed = parseItemQr(raw);
        if (!parsed) {
            this.setValidation('error', 'Invalid Item QR format. Expected: ITEMCODE|TYPE|GRN NO|ITEMGROUP|UNIQUE NUMBER|QTY', () => this.itemScanSection?.focusInput());
            return;
        }

        this.itemScanSection?.setPreview(parsed);

        if (this.currentBoxItemGroup && parsed.itemGroup !== this.currentBoxItemGroup) {
            this.setValidation('error', `Invalid Item Group. Current Box Item Group: ${this.currentBoxItemGroup}. Scanned Item Group: ${parsed.itemGroup}. Only ${this.currentBoxItemGroup} items are allowed in this box.`, () => this.itemScanSection?.focusInput());
            return;
        }

        // Unique Number is not, by itself, a valid duplicate key (ItemCode + UniqueNumber is) —
        // the backend is the sole authority on whether this combination has already been scanned.
        this.scanning = true;
        this.preBinningApi.scanItem({
            boxNumber: this.currentBox,
            itemCode: parsed.itemCode,
            type: parsed.type,
            grnNo: parsed.grnNo,
            itemGroup: parsed.itemGroup,
            uniqueNumber: parsed.uniqueNumber,
            qty: parsed.qty,
            whsCode: this.selectedWarehouse as string
        }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    const data = res.data || {};
                    this.currentBoxItems = [...this.currentBoxItems, { ...parsed, scanTime: this.formatTime(new Date()) }];
                    this.currentBoxItemGroup = this.currentBoxItemGroup || parsed.itemGroup;
                    this.currentBoxQty = data.boxTotalQty ?? (this.currentBoxQty + parsed.qty);
                    this.showToast(`Item Added Successfully — ${parsed.itemCode} / Unique No: ${parsed.uniqueNumber} / Qty: ${parsed.qty}`, 'success');
                    this.setValidation('success', 'Item added successfully.');
                    this.loadWarehouseStock();
                    this.itemScanSection?.focusInput();
                } else if (res?.code === 'DUPLICATE_ITEM_UNIQUE_NUMBER') {
                    this.presentDuplicateItemAlert(parsed.itemCode, parsed.uniqueNumber, () => this.itemScanSection?.focusInput());
                } else {
                    this.setValidation('error', res?.message || 'Item scan failed.', () => this.itemScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                const msg = this.extractErrorMessage(err);
                this.setValidation('error', msg, () => this.itemScanSection?.focusInput());
                if (err?.status === 409) {
                    this.loadWarehouseStock();
                }
            }
        });
    }

    async completeBox() {
        if (!this.isBoxScanned || !this.currentBox) {
            return;
        }
        if (this.currentBoxItems.length === 0) {
            this.setValidation('error', 'Add at least one item before completing the box.', () => this.itemScanSection?.focusInput());
            return;
        }

        const alert = await this.alertController.create({
            header: 'ARE YOU SURE TO COMPLETE THIS BOX?',
            buttons: [
                { text: 'Yes', cssClass: 'alert-button-inline', handler: () => this.confirmCompleteBox() },
                { text: 'No', cssClass: 'alert-button-inline', handler: () => this.itemScanSection?.focusInput() }
            ],
            cssClass: 'custom-alert'
        });
        await alert.present();
    }

    private confirmCompleteBox() {
        if (!this.currentBox || !this.selectedWarehouse) {
            return;
        }
        this.scanning = true;
        this.preBinningApi.completeBox({ boxNumber: this.currentBox, whsCode: this.selectedWarehouse }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    this.showToast('Box completed successfully.', 'success');
                    this.resetCurrentBox();
                    this.isBoxCompleted = true;
                    this.loadWarehouseStock();
                } else {
                    this.setValidation('error', res?.message || 'Failed to complete box.', () => this.itemScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                this.setValidation('error', this.extractErrorMessage(err), () => this.itemScanSection?.focusInput());
            }
        });
    }

    private resetCurrentBox() {
        this.currentBox = null;
        this.currentBoxItemGroup = null;
        this.currentBoxItems = [];
        this.currentBoxQty = 0;
        this.currentBoxStatus = '';
        this.isBoxScanned = false;
        this.validationMessage = '';
        this.validationLevel = '';
        this.itemScanSection?.setPreview(null);
        this.boxScanSection?.focusInput();
    }

    private setValidation(level: 'success' | 'error' | 'warning', message: string, onDismiss?: () => void) {
        this.validationLevel = level;
        this.validationMessage = message;
        if (level === 'error') {
            this.presentValidationAlert(message, onDismiss);
        }
    }

    private async presentDuplicateItemAlert(itemCode: string, uniqueNumber: string, onDismiss?: () => void) {
        const message = `Item Code: ${itemCode}<br>Unique No: ${uniqueNumber}<br><br>This Item Code + Unique Number has already been scanned.`;
        this.validationLevel = 'error';
        this.validationMessage = `Duplicate Item Scan. Item Code: ${itemCode}, Unique No: ${uniqueNumber}. This Item Code + Unique Number has already been scanned.`;
        const alert = await this.alertController.create({
            header: 'Duplicate Item Scan',
            message,
            buttons: [{
                text: 'OK',
                cssClass: 'alert-button-confirm',
                handler: () => { onDismiss?.(); }
            }],
            cssClass: 'custom-alert'
        });
        await alert.present();
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
            return 'This box/item was just changed by another scanner. Stock has been refreshed.';
        }
        if (err?.status === 0) {
            return 'Network error. Please check your connection.';
        }
        return err?.message || 'Something went wrong.';
    }

    private formatTime(date: Date): string {
        return date.toLocaleTimeString('en-GB', { hour12: false });
    }
}
