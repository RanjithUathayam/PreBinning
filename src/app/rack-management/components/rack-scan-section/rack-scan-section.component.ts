import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { RackInfo, RackWarehouse } from '../../rack-management.types';

@Component({
    selector: 'app-rm-rack-scan-section',
    templateUrl: './rack-scan-section.component.html',
    styleUrls: ['./rack-scan-section.component.scss'],
})
export class RackScanSectionComponent {

    @Input() disabled = false;
    @Input() scanning = false;
    @Input() locked = false;
    @Input() placeholder = 'Scan / Enter Rack QR Code';
    @Input() rack: RackInfo | null = null;
    @Input() stockItemCount = 0;
    @Input() stockTotalQty = 0;
    @Input() warehouses: RackWarehouse[] = [];
    @Input() selectedWarehouse: string | null = null;
    @Input() loadingWarehouses = false;

    @Output() rackScanned = new EventEmitter<string>();
    @Output() changeRack = new EventEmitter<void>();
    @Output() warehouseChange = new EventEmitter<string>();

    @ViewChild('rackInput') rackInputRef!: ElementRef<HTMLInputElement>;

    onEnter(event: any) {
        const value = event.target.value;
        event.target.value = '';
        this.rackScanned.emit(value);
    }

    onScanButtonClick() {
        if (this.rackInputRef?.nativeElement) {
            const value = this.rackInputRef.nativeElement.value;
            this.rackInputRef.nativeElement.value = '';
            this.rackScanned.emit(value);
        }
    }

    onChangeRackClick() {
        this.changeRack.emit();
    }

    focusInput() {
        setTimeout(() => this.rackInputRef?.nativeElement?.focus(), 0);
    }
}
