import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { LocationMappingApiService } from './services/location-mapping-api.service';
import { MappedLocationEntry, PalletLocationDetails, PositionOption, RowOption, WarehouseOption } from './location-mapping.types';
import { PalletScanSectionComponent } from './components/pallet-scan-section/pallet-scan-section.component';

@Component({
    selector: 'app-location-mapping',
    templateUrl: './location-mapping.page.html',
    styleUrls: ['./location-mapping.page.scss'],
})
export class LocationMappingPage implements OnInit, OnDestroy {

    @ViewChild(PalletScanSectionComponent) palletScanSection!: PalletScanSectionComponent;

    // header context
    currentUser: string = localStorage.getItem('UserName') || 'N/A';
    selectedStation: string = localStorage.getItem('DeviceID') || 'N/A';
    currentDateTime: Date = new Date();
    private clockTimer: any;

    // step 1 — warehouse
    warehouseList: WarehouseOption[] = [];
    loadingWarehouses = false;
    selectedWarehouse: string | null = localStorage.getItem('LocationMappingWarehouseCode') || null;
    selectedWarehouseName: string | null = null;

    // step 2 — row
    rowList: RowOption[] = [];
    loadingRows = false;
    selectedRow: string | null = null;

    // step 3 — pallet position
    positionList: PositionOption[] = [];
    loadingPositions = false;
    selectedLocationCode: string | null = null;
    selectedPositionNo: string | null = null;

    // step 4/5 — pallet scan + validation
    pallet: PalletLocationDetails | null = null;
    scanning = false;
    mapping = false;

    // continuous workflow visibility
    recentMappings: MappedLocationEntry[] = [];

    // validation banner
    validationMessage = '';
    validationLevel: 'success' | 'error' | 'warning' | '' = '';

    constructor(
        private locationMappingApi: LocationMappingApiService,
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

    formattedWarehouseLabel(): string {
        if (!this.selectedWarehouse) {
            return '';
        }
        return this.selectedWarehouseName ? `${this.selectedWarehouse} - ${this.selectedWarehouseName}` : this.selectedWarehouse;
    }

    loadWarehouses() {
        this.loadingWarehouses = true;
        this.locationMappingApi.getWarehouses().subscribe({
            next: (res: any) => {
                this.loadingWarehouses = false;
                if (res && res.success) {
                    this.warehouseList = res.data || [];
                    if (this.selectedWarehouse) {
                        const wh = this.warehouseList.find((w) => w.warehouseCode === this.selectedWarehouse);
                        if (wh) {
                            this.selectedWarehouseName = wh.warehouseName;
                            this.loadRows(this.selectedWarehouse);
                        } else {
                            this.selectedWarehouse = null;
                            localStorage.removeItem('LocationMappingWarehouseCode');
                        }
                    }
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

    onWarehouseChange(code: string) {
        if (!code || code === this.selectedWarehouse) {
            return;
        }
        this.selectedWarehouse = code;
        const wh = this.warehouseList.find((w) => w.warehouseCode === code);
        this.selectedWarehouseName = wh ? wh.warehouseName : null;
        localStorage.setItem('LocationMappingWarehouseCode', code);
        this.resetRowAndPosition();
        this.resetPallet();
        this.loadRows(code);
    }

    loadRows(whsCode: string) {
        this.loadingRows = true;
        this.locationMappingApi.getRows(whsCode).subscribe({
            next: (res: any) => {
                this.loadingRows = false;
                if (res && res.success) {
                    this.rowList = res.data || [];
                } else {
                    this.showToast(res?.message || 'Failed to load rows.', 'danger');
                }
            },
            error: (err: any) => {
                this.loadingRows = false;
                this.showToast(this.extractErrorMessage(err), 'danger');
            }
        });
    }

    onRowChange(code: string) {
        if (!code || code === this.selectedRow) {
            return;
        }
        this.selectedRow = code;
        this.selectedLocationCode = null;
        this.selectedPositionNo = null;
        this.positionList = [];
        this.resetPallet();
        this.loadPositions();
    }

    loadPositions() {
        if (!this.selectedWarehouse || !this.selectedRow) {
            return;
        }
        this.loadingPositions = true;
        this.locationMappingApi.getAvailablePositions(this.selectedWarehouse, this.selectedRow).subscribe({
            next: (res: any) => {
                this.loadingPositions = false;
                if (res && res.success) {
                    this.positionList = res.data || [];
                } else {
                    this.showToast(res?.message || 'Failed to load available positions.', 'danger');
                }
            },
            error: (err: any) => {
                this.loadingPositions = false;
                this.showToast(this.extractErrorMessage(err), 'danger');
            }
        });
    }

    onPositionChange(locationCode: string) {
        if (!locationCode || locationCode === this.selectedLocationCode) {
            return;
        }
        this.selectedLocationCode = locationCode;
        const pos = this.positionList.find((p) => p.locationCode === locationCode);
        this.selectedPositionNo = pos ? pos.positionNo : locationCode;
        this.resetPallet();
        this.palletScanSection?.focusInput();
    }

    onPalletScanned(rawValue: string) {
        const palletQr = (rawValue || '').trim();
        if (this.scanning || !palletQr) {
            return;
        }

        if (!this.selectedLocationCode) {
            this.setValidation('error', 'Please select Warehouse, Row and Position before scanning a pallet.');
            return;
        }

        if (this.pallet) {
            return;
        }

        this.scanning = true;
        this.locationMappingApi.getPalletMapping(palletQr).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    const data = res.data || {};
                    if (data.status !== 'COMPLETED') {
                        this.setValidation('error', `Pallet ${palletQr} has not completed Pallet Mapping yet.`, () => this.palletScanSection?.focusInput());
                        return;
                    }
                    const boxes = data.boxes || [];
                    this.pallet = {
                        palletId: data.palletId || palletQr,
                        palletStatus: data.status || '',
                        boxCount: data.totalBoxCount ?? boxes.length,
                        totalQty: boxes.reduce((sum: number, b: any) => sum + (b.boxTotalQty || 0), 0),
                        inventoryStatus: ''
                    };
                    this.setValidation('success', `Pallet ${this.pallet.palletId} validated. Ready to map to ${this.selectedPositionNo}.`);
                } else {
                    this.setValidation('error', res?.message || 'Pallet validation failed.', () => this.palletScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                if (err?.status === 404) {
                    this.setValidation('error', `Pallet ${palletQr} has no Pallet Mapping record.`, () => this.palletScanSection?.focusInput());
                    return;
                }
                this.setValidation('error', this.extractErrorMessage(err), () => this.palletScanSection?.focusInput());
            }
        });
    }

    confirmMapLocation() {
        if (!this.pallet || !this.selectedWarehouse || !this.selectedRow || !this.selectedLocationCode || this.mapping) {
            return;
        }

        const mappedPallet = this.pallet;
        const mappedPositionNo = this.selectedPositionNo || this.selectedLocationCode;

        this.mapping = true;
        this.locationMappingApi.mapLocation({
            palletId: mappedPallet.palletId,
            whsCode: this.selectedWarehouse,
            rowCode: this.selectedRow,
            locationCode: this.selectedLocationCode
        }).subscribe({
            next: (res: any) => {
                this.mapping = false;
                if (res && res.success) {
                    const data = res.data || {};
                    this.recentMappings = [{
                        palletId: mappedPallet.palletId,
                        locationCode: mappedPositionNo,
                        boxCount: mappedPallet.boxCount,
                        totalQty: mappedPallet.totalQty,
                        inventoryStatus: data.inventoryStatus || mappedPallet.inventoryStatus,
                        mappedTime: this.formatTime(new Date())
                    }, ...this.recentMappings];
                    this.showToast(`Pallet ${mappedPallet.palletId} mapped to ${mappedPositionNo} successfully.`, 'success');
                    this.setValidation('success', `Pallet ${mappedPallet.palletId} mapped successfully. Select the next Position to continue.`);
                    this.afterSuccessfulMapping();
                } else {
                    this.setValidation('error', res?.message || 'Failed to map location.');
                }
            },
            error: (err: any) => {
                this.mapping = false;
                this.setValidation('error', this.extractErrorMessage(err));
            }
        });
    }

    cancelPallet() {
        this.resetPallet();
        this.palletScanSection?.focusInput();
    }

    private afterSuccessfulMapping() {
        this.pallet = null;
        this.selectedLocationCode = null;
        this.selectedPositionNo = null;
        this.positionList = [];
        if (this.selectedRow) {
            this.loadPositions();
        }
    }

    private resetRowAndPosition() {
        this.selectedRow = null;
        this.selectedLocationCode = null;
        this.selectedPositionNo = null;
        this.rowList = [];
        this.positionList = [];
    }

    private resetPallet() {
        this.pallet = null;
        this.validationMessage = '';
        this.validationLevel = '';
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
            return 'This pallet/location was just changed by another scanner. Please retry.';
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
