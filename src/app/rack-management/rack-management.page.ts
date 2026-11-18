import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { RackManagementApiService } from './services/rack-management-api.service';
import { RackInfo, RackMode, RackScanLine, RackScannedItem, RackStockLine, RackTransaction, RackWarehouse } from './rack-management.types';
import { RackScanSectionComponent } from './components/rack-scan-section/rack-scan-section.component';
import { RackItemScanSectionComponent } from './components/item-scan-section/item-scan-section.component';

type RackTab = RackMode | 'HISTORY';

/** Per-device convenience: the last warehouse the operator worked in. */
const WAREHOUSE_STORAGE_KEY = 'RackManagementWarehouse';

const ERROR_CODE_MESSAGES: { [code: string]: string } = {
    MISSING_FIELDS: 'Required information is missing. Please rescan and try again.',
    WAREHOUSE_REQUIRED: 'Please select a warehouse first.',
    INVALID_MODE: 'Invalid mode. Please select Store or Picking.',
    INVALID_ITEM_QR: 'Invalid item QR code. Please scan a valid item label.',
    INVALID_QTY: 'Quantity must be greater than 0 (up to 3 decimals).',
    RACK_NOT_FOUND: 'Invalid Rack QR code. Rack was not found.',
    RACK_INACTIVE: 'This rack is inactive.',
    RACK_BLOCKED: 'This rack is blocked.',
    RACK_EMPTY: 'This rack has no stock to pick.',
    ITEM_NOT_FOUND: 'Invalid item QR code. Item was not found in the item master.',
    DUPLICATE_SCAN: 'This item label has already been scanned.',
    TOO_MANY_LINES: 'Too many lines in one save. Please save in smaller batches.'
};

/** Codes whose server message is more specific than the generic text (it names the rack/item/quantities). */
const USE_SERVER_MESSAGE = ['WAREHOUSE_MISMATCH', 'ITEM_NOT_IN_RACK', 'INSUFFICIENT_STOCK', 'TAG_ALREADY_STORED', 'TAG_ALREADY_PICKED', 'DUPLICATE_SCAN'];

/** Errors after which the rack's stock has changed under us — re-read it. */
const STOCK_CONFLICT_CODES = ['ITEM_NOT_IN_RACK', 'INSUFFICIENT_STOCK', 'TAG_ALREADY_STORED', 'TAG_ALREADY_PICKED'];

@Component({
    selector: 'app-rack-management',
    templateUrl: './rack-management.page.html',
    styleUrls: ['./rack-management.page.scss'],
})
export class RackManagementPage implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild(RackScanSectionComponent) rackScanSection!: RackScanSectionComponent;
    @ViewChild(RackItemScanSectionComponent) itemScanSection!: RackItemScanSectionComponent;

    // header context
    currentUser: string = localStorage.getItem('UserName') || 'N/A';
    selectedStation: string = localStorage.getItem('DeviceID') || 'N/A';
    currentDateTime: Date = new Date();
    private clockTimer: any;

    // warehouse
    warehouses: RackWarehouse[] = [];
    selectedWarehouse: string | null = null;
    loadingWarehouses = false;

    activeTab: RackTab = 'STORE';
    mode: RackMode = 'STORE';

    // current rack
    rack: RackInfo | null = null;
    stock: RackStockLine[] = [];
    stockTotalQty = 0;

    // unsaved scanned lines + derived review state
    lines: RackScanLine[] = [];
    lineErrors: { [key: string]: string } = {};
    projectedQtyByItem: { [itemCode: string]: number } = {};
    totalQty = 0;
    canSave = false;

    /** One id per batch; reused on retries of the SAME batch so a repeated Save is never applied twice. */
    private clientRequestId: string | null = null;
    lastSaved: RackTransaction | null = null;

    scanning = false;
    saving = false;
    validationMessage = '';
    validationLevel: 'success' | 'error' | 'warning' | '' = '';

    constructor(
        private rackApi: RackManagementApiService,
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

    ngAfterViewInit(): void {
        this.rackScanSection?.focusInput();
    }

    get isRackScanned(): boolean {
        return !!this.rack;
    }

    /* ---------------------------------------------------------------- warehouse */

    private loadWarehouses() {
        this.loadingWarehouses = true;
        this.rackApi.getWarehouses().subscribe({
            next: (res: any) => {
                this.loadingWarehouses = false;
                if (res && res.success) {
                    this.warehouses = res.data || [];
                    const remembered = this.readStoredWarehouse();
                    const preselect = this.warehouses.find((w) => w.warehouseCode === remembered)
                        || (this.warehouses.length === 1 ? this.warehouses[0] : null);
                    if (preselect && !this.selectedWarehouse) {
                        this.selectedWarehouse = preselect.warehouseCode;
                        this.rackScanSection?.focusInput();
                    }
                } else {
                    this.setValidation('error', this.messageFor(res?.code, res?.message || 'Unable to load warehouses.'));
                }
            },
            error: (err: any) => {
                this.loadingWarehouses = false;
                this.setValidation('error', `Unable to load warehouses. ${this.extractErrorMessage(err)}`);
            }
        });
    }

    onWarehouseChange(whsCode: string) {
        if (this.isRackScanned || whsCode === this.selectedWarehouse) {
            return;
        }
        this.selectedWarehouse = whsCode;
        try {
            localStorage.setItem(WAREHOUSE_STORAGE_KEY, whsCode);
        } catch { }
        this.validationMessage = '';
        this.validationLevel = '';
        this.rackScanSection?.focusInput();
    }

    private readStoredWarehouse(): string | null {
        try {
            return localStorage.getItem(WAREHOUSE_STORAGE_KEY);
        } catch {
            return null;
        }
    }

    /* ---------------------------------------------------------------- tabs / mode */

    async selectTab(tab: RackTab) {
        if (tab === this.activeTab || this.saving) {
            return;
        }
        if (tab === 'HISTORY' || this.activeTab === 'HISTORY' && tab === this.mode) {
            this.activeTab = tab;
            this.focusCurrentInput();
            return;
        }
        if (this.lines.length > 0) {
            const confirmed = await this.confirm('DISCARD SCANNED ITEMS?',
                `Switching to ${tab === 'PICK' ? 'Picking' : 'Store'} will discard ${this.lines.length} unsaved line(s).`);
            if (!confirmed) {
                return;
            }
        }
        this.activeTab = tab;
        this.mode = tab;
        this.clearLines();
        this.lastSaved = null;
        this.validationMessage = '';
        this.validationLevel = '';
        if (this.rack) {
            // Keep the same rack in the new mode if it is valid there (e.g. Picking needs stock).
            this.loadRack(this.rack.rackCode, true);
        } else {
            this.focusCurrentInput();
        }
    }

    /* ---------------------------------------------------------------- rack */

    onRackScanned(rawValue: string) {
        const rackCode = (rawValue || '').trim();
        if (this.scanning || !rackCode || this.isRackScanned) {
            return;
        }
        if (!this.selectedWarehouse) {
            this.setValidation('error', ERROR_CODE_MESSAGES['WAREHOUSE_REQUIRED']);
            return;
        }
        this.loadRack(rackCode, false);
    }

    private loadRack(rackCode: string, keepOnModeSwitch: boolean) {
        if (!this.selectedWarehouse) {
            return;
        }
        this.scanning = true;
        this.rackApi.scanRack({ mode: this.mode, whsCode: this.selectedWarehouse, rackCode }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success) {
                    this.applyRackData(res.data || {});
                    const verb = this.mode === 'PICK' ? 'pick from' : 'store into';
                    this.setValidation('success', `Rack ${this.rack?.rackCode} ready. Scan items to ${verb} this rack.`);
                    this.itemScanSection?.focusInput();
                } else {
                    this.resetRack();
                    this.setValidation('error', this.messageFor(res?.code, res?.message), () => this.rackScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                this.resetRack();
                const message = this.extractErrorMessage(err);
                this.setValidation('error', keepOnModeSwitch ? `${message} Please scan a rack.` : message, () => this.rackScanSection?.focusInput());
            }
        });
    }

    private applyRackData(data: any) {
        this.rack = data.rack || null;
        this.stock = data.stock || [];
        this.stockTotalQty = data.totalQty ?? 0;
    }

    /** Re-reads the rack's stock after a save/conflict without touching the banner or focus. */
    private refreshRackSilently() {
        if (!this.rack || !this.selectedWarehouse) {
            return;
        }
        // STORE mode never rejects a valid rack; for PICK an emptied rack legitimately returns RACK_EMPTY.
        this.rackApi.scanRack({ mode: 'STORE', whsCode: this.selectedWarehouse, rackCode: this.rack.rackCode }).subscribe({
            next: (res: any) => {
                if (res && res.success) {
                    this.applyRackData(res.data || {});
                    this.syncAvailableQty();
                }
            },
            error: () => { }
        });
    }

    async changeRack() {
        if (!this.isRackScanned || this.saving) {
            return;
        }
        if (this.lines.length > 0) {
            const confirmed = await this.confirm('SCAN A DIFFERENT RACK?', `This will discard ${this.lines.length} unsaved line(s).`);
            if (!confirmed) {
                this.itemScanSection?.focusInput();
                return;
            }
        }
        this.resetRack();
        this.validationMessage = '';
        this.validationLevel = '';
        this.rackScanSection?.focusInput();
    }

    private resetRack() {
        this.rack = null;
        this.stock = [];
        this.stockTotalQty = 0;
        this.clearLines();
    }

    /* ---------------------------------------------------------------- items */

    onItemScanned(rawValue: string) {
        const itemQr = (rawValue || '').trim();
        if (this.scanning || this.saving || !itemQr) {
            return;
        }
        if (!this.rack || !this.selectedWarehouse) {
            this.setValidation('error', 'Please select a warehouse and scan the Rack QR code first.', () => this.rackScanSection?.focusInput());
            return;
        }

        const tagged = itemQr.includes('|');
        const parts = itemQr.split('|').map((p) => p.trim());
        if (tagged) {
            const key = this.tagKey(parts[0], parts[2], parts[4]);
            if (this.lines.some((l) => l.key === key)) {
                this.setValidation('error', `${ERROR_CODE_MESSAGES['DUPLICATE_SCAN']} (${parts[0]} / ${parts[4]})`, () => this.itemScanSection?.focusInput());
                return;
            }
        }
        const scannedItemCode = (tagged ? parts[0] : itemQr).toUpperCase();
        const scannedQty = this.sumQty(this.lines.filter((l) => l.itemCode.toUpperCase() === scannedItemCode).map((l) => l.qty));

        this.scanning = true;
        this.rackApi.scanItem({ mode: this.mode, whsCode: this.selectedWarehouse, rackCode: this.rack.rackCode, itemQr, scannedQty }).subscribe({
            next: (res: any) => {
                this.scanning = false;
                if (res && res.success && res.data?.item) {
                    this.addScannedItem(res.data.item);
                } else {
                    this.setValidation('error', this.messageFor(res?.code, res?.message), () => this.itemScanSection?.focusInput());
                }
            },
            error: (err: any) => {
                this.scanning = false;
                this.setValidation('error', this.extractErrorMessage(err), () => this.itemScanSection?.focusInput());
            }
        });
    }

    private addScannedItem(item: RackScannedItem) {
        const key = item.tagged ? this.tagKey(item.itemCode, item.grnNo, item.uniqueNumber) : `ITEM|${item.itemCode.toUpperCase()}`;
        const existing = this.lines.find((l) => l.key === key);

        if (existing && item.tagged) {
            this.setValidation('error', ERROR_CODE_MESSAGES['DUPLICATE_SCAN'], () => this.itemScanSection?.focusInput());
            return;
        }
        if (existing) {
            // Same untagged item scanned again: one more piece on the same line.
            this.lines = this.lines.map((l) => l.key === key ? { ...l, qty: this.sumQty([l.qty, item.qty]), availableQty: item.availableQty } : l);
        } else {
            this.lines = [...this.lines, { ...item, key }];
        }
        this.syncAvailableQty(item.itemCode, item.availableQty);
        this.onLinesChanged();

        const line = this.lines.find((l) => l.key === key) as RackScanLine;
        this.setValidation('success', `${item.itemCode}${item.itemName ? ' — ' + item.itemName : ''} | Qty ${line.qty}${existing ? ' (updated)' : ''}`);
        this.itemScanSection?.focusInput();
    }

    onQtyChange(event: { line: RackScanLine; qty: number }) {
        this.lines = this.lines.map((l) => l.key === event.line.key ? { ...l, qty: event.qty } : l);
        this.onLinesChanged();
    }

    async onRemoveLine(line: RackScanLine) {
        const confirmed = await this.confirm('REMOVE THIS LINE?', `${line.itemCode}${line.tagged ? ' / ' + line.uniqueNumber : ''} — Qty ${line.qty}`);
        if (confirmed) {
            this.lines = this.lines.filter((l) => l.key !== line.key);
            this.onLinesChanged();
        }
        this.itemScanSection?.focusInput();
    }

    async onClearLines() {
        const confirmed = await this.confirm('CLEAR ALL SCANNED ITEMS?', `${this.lines.length} unsaved line(s) will be removed.`);
        if (confirmed) {
            this.clearLines();
            this.validationMessage = '';
            this.validationLevel = '';
        }
        this.itemScanSection?.focusInput();
    }

    private clearLines() {
        this.lines = [];
        this.onLinesChanged();
    }

    /** Keeps every line of an item on the latest known rack quantity. With no args, re-reads it from the rack stock. */
    private syncAvailableQty(itemCode?: string, availableQty?: number) {
        this.lines = this.lines.map((l) => {
            if (itemCode !== undefined) {
                return l.itemCode.toUpperCase() === itemCode.toUpperCase() ? { ...l, availableQty: availableQty as number } : l;
            }
            const row = this.stock.find((s) => s.itemCode.toUpperCase() === l.itemCode.toUpperCase());
            return { ...l, availableQty: row ? row.quantity : 0 };
        });
        this.recomputeReview();
    }

    /** Any change to the batch invalidates its idempotency key — it is a different batch now. */
    private onLinesChanged() {
        this.clientRequestId = null;
        this.recomputeReview();
    }

    private recomputeReview() {
        const errors: { [key: string]: string } = {};
        const totals: { [itemCode: string]: number } = {};
        const available: { [itemCode: string]: number } = {};

        this.lines.forEach((l) => {
            if (!this.isValidQty(l.qty)) {
                errors[l.key] = 'Enter a quantity greater than 0 (max 3 decimals).';
            }
            totals[l.itemCode] = this.sumQty([totals[l.itemCode] || 0, this.isValidQty(l.qty) ? l.qty : 0]);
            available[l.itemCode] = l.availableQty;
        });

        const projected: { [itemCode: string]: number } = {};
        Object.keys(totals).forEach((itemCode) => {
            projected[itemCode] = this.mode === 'PICK'
                ? this.subtractQty(available[itemCode], totals[itemCode])
                : this.sumQty([available[itemCode], totals[itemCode]]);
        });

        if (this.mode === 'PICK') {
            this.lines.forEach((l) => {
                if (!errors[l.key] && totals[l.itemCode] > available[l.itemCode]) {
                    errors[l.key] = `Total ${totals[l.itemCode]} exceeds available ${available[l.itemCode]}.`;
                }
            });
        }

        this.lineErrors = errors;
        this.projectedQtyByItem = projected;
        this.totalQty = this.sumQty(this.lines.map((l) => this.isValidQty(l.qty) ? l.qty : 0));
        this.canSave = !!this.rack && this.lines.length > 0 && Object.keys(errors).length === 0;
    }

    /* ---------------------------------------------------------------- save */

    async onSave() {
        if (this.saving || !this.canSave || !this.rack) {
            return;
        }
        const action = this.mode === 'PICK' ? 'PICKING' : 'STORE';
        const confirmed = await this.confirm(`ARE YOU SURE TO SAVE ${action}?`,
            `${this.lines.length} line(s), total qty ${this.totalQty} ${this.mode === 'PICK' ? 'from' : 'into'} rack ${this.rack.rackCode} (warehouse ${this.selectedWarehouse}).`);
        if (!confirmed) {
            this.itemScanSection?.focusInput();
            return;
        }
        this.save();
    }

    private save() {
        if (this.saving || !this.rack || !this.selectedWarehouse) {
            return;
        }
        this.saving = true;
        this.clientRequestId = this.clientRequestId || this.newRequestId();

        this.rackApi.save({
            mode: this.mode,
            whsCode: this.selectedWarehouse,
            rackCode: this.rack.rackCode,
            clientRequestId: this.clientRequestId,
            deviceId: this.selectedStation,
            items: this.lines.map((l) => l.tagged && l.itemQr ? { itemQr: l.itemQr } : { itemCode: l.itemCode, qty: Number(l.qty) })
        }).subscribe({
            next: (res: any) => {
                this.saving = false;
                if (res && res.success && res.data) {
                    this.onSaved(res.data);
                } else {
                    this.onSaveFailed(res?.code, this.messageFor(res?.code, res?.message));
                }
            },
            error: (err: any) => {
                this.saving = false;
                if (err?.status === 0) {
                    // The save may or may not have reached the server. Keep the same clientRequestId:
                    // pressing Save again either completes it or returns the already-saved transaction.
                    this.setValidation('error', 'Network error. The save could not be confirmed — check the connection and press Save again. It will not be applied twice.');
                    return;
                }
                this.onSaveFailed(err?.error?.code, this.extractErrorMessage(err));
            }
        });
    }

    private onSaved(data: RackTransaction) {
        this.lastSaved = data;
        this.clientRequestId = null;
        this.clearLines();
        this.refreshRackSilently();

        const what = data.mode === 'PICK' ? 'Picking' : 'Store';
        if (data.duplicate) {
            this.setValidation('warning', `This batch was already saved as ${data.transactionNo}. Inventory was not changed again.`);
        } else {
            this.setValidation('success', `${what} ${data.transactionNo} saved — ${data.totalLines} line(s), qty ${data.totalQty}. Inventory updated.`);
            this.showToast(`${what} ${data.transactionNo} saved successfully.`, 'success');
        }
        this.itemScanSection?.focusInput();
    }

    private onSaveFailed(code: string | undefined, message: string) {
        this.setValidation('error', `Not saved. ${message}`, () => this.itemScanSection?.focusInput());
        if (code && STOCK_CONFLICT_CODES.includes(code)) {
            this.refreshRackSilently();
        }
        if (code === 'RACK_INACTIVE' || code === 'RACK_BLOCKED' || code === 'RACK_NOT_FOUND' || code === 'WAREHOUSE_MISMATCH') {
            this.resetRack();
        }
    }

    /* ---------------------------------------------------------------- helpers */

    private focusCurrentInput() {
        if (this.activeTab === 'HISTORY') {
            return;
        }
        if (this.rack) {
            this.itemScanSection?.focusInput();
        } else {
            this.rackScanSection?.focusInput();
        }
    }

    private tagKey(itemCode: string | null, grnNo: string | null, uniqueNumber: string | null): string {
        return `TAG|${itemCode || ''}|${grnNo || ''}|${uniqueNumber || ''}`.toUpperCase();
    }

    private isValidQty(qty: number): boolean {
        return Number.isFinite(qty) && qty > 0 && Math.round(qty * 1000) / 1000 === qty;
    }

    // Quantities are DECIMAL(18,3) — do arithmetic in thousandths to avoid float drift (same as the backend).
    private sumQty(values: number[]): number {
        return values.reduce((acc, v) => acc + Math.round(Number(v || 0) * 1000), 0) / 1000;
    }

    private subtractQty(a: number, b: number): number {
        return (Math.round(Number(a) * 1000) - Math.round(Number(b) * 1000)) / 1000;
    }

    private newRequestId(): string {
        const c: any = (window as any).crypto;
        if (c && typeof c.randomUUID === 'function') {
            return c.randomUUID();
        }
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    }

    private messageFor(code?: string, message?: string): string {
        if (code && USE_SERVER_MESSAGE.includes(code) && message) {
            return message;
        }
        if (code && ERROR_CODE_MESSAGES[code]) {
            return ERROR_CODE_MESSAGES[code];
        }
        return message || 'Something went wrong.';
    }

    private extractErrorMessage(err: any): string {
        const code = err?.error?.code;
        if (code) {
            return this.messageFor(code, err?.error?.message);
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
            return 'Network error. Please check your connection.';
        }
        return 'Something went wrong.';
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

    private async confirm(header: string, message: string): Promise<boolean> {
        const alert = await this.alertController.create({
            header,
            message,
            buttons: [
                { text: 'Yes', role: 'confirm', cssClass: 'alert-button-inline' },
                { text: 'No', role: 'cancel', cssClass: 'alert-button-inline' }
            ],
            cssClass: 'custom-alert'
        });
        await alert.present();
        const { role } = await alert.onDidDismiss();
        return role === 'confirm';
    }

    private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
        const toast = await this.toastController.create({ message, duration: 2500, color, position: 'top' });
        await toast.present();
    }
}
