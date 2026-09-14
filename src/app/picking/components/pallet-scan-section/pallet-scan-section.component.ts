import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'app-pk-pallet-scan-section',
    templateUrl: './pallet-scan-section.component.html',
    styleUrls: ['./pallet-scan-section.component.scss'],
})
export class PickingPalletScanSectionComponent {

    @Input() disabled = false;
    @Input() scanning = false;
    @Input() locked = false;
    @Input() placeholder = 'Scan / Enter Pallet Number';
    @Input() palletNumber: string | null = null;
    @Input() pickingStatus = '';
    @Input() totalItems = 0;
    @Input() pickedItems = 0;

    @Output() palletScanned = new EventEmitter<string>();
    @Output() changePallet = new EventEmitter<void>();

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

    onChangePalletClick() {
        this.changePallet.emit();
    }

    focusInput() {
        setTimeout(() => this.palletInputRef?.nativeElement?.focus(), 0);
    }
}
