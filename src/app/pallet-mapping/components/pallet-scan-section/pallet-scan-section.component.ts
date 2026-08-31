import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'app-pallet-scan-section',
    templateUrl: './pallet-scan-section.component.html',
    styleUrls: ['./pallet-scan-section.component.scss'],
})
export class PalletScanSectionComponent {

    @Input() disabled = false;
    @Input() scanning = false;
    @Input() locked = false;
    @Input() placeholder = 'Scan / Enter Pallet ID';
    @Input() palletId: string | null = null;
    @Input() status = '';
    @Input() totalBoxes = 0;

    @Output() palletScanned = new EventEmitter<string>();
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

    onCancelClick() {
        this.cancelPallet.emit();
    }

    focusInput() {
        setTimeout(() => this.palletInputRef?.nativeElement?.focus(), 0);
    }
}
