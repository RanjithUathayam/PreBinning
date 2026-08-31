import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { PalletLocationDetails } from '../../location-mapping.types';

@Component({
    selector: 'app-lm-pallet-scan-section',
    templateUrl: './pallet-scan-section.component.html',
    styleUrls: ['./pallet-scan-section.component.scss'],
})
export class PalletScanSectionComponent {

    @Input() disabled = false;
    @Input() scanning = false;
    @Input() mapping = false;
    @Input() placeholder = 'Scan Pallet QR';
    @Input() locationCode: string | null = null;
    @Input() pallet: PalletLocationDetails | null = null;

    @Output() palletScanned = new EventEmitter<string>();
    @Output() mapLocation = new EventEmitter<void>();
    @Output() cancelPallet = new EventEmitter<void>();

    @ViewChild('palletInput') palletInputRef!: ElementRef<HTMLInputElement>;

    onEnter(event: any) {
        const value = event.target.value;
        event.target.value = '';
        this.palletScanned.emit(value);
    }

    onScanButtonClick() {
        if (this.palletInputRef?.nativeElement) {
            const value = this.palletInputRef.nativeElement.value;
            this.palletInputRef.nativeElement.value = '';
            this.palletScanned.emit(value);
        }
    }

    onMapClick() {
        this.mapLocation.emit();
    }

    onCancelClick() {
        this.cancelPallet.emit();
    }

    focusInput() {
        setTimeout(() => this.palletInputRef?.nativeElement?.focus(), 0);
    }
}
