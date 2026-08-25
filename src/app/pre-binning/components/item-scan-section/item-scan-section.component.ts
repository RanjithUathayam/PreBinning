import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ParsedItemQr } from '../../pre-binning.types';

@Component({
    selector: 'app-item-scan-section',
    templateUrl: './item-scan-section.component.html',
    styleUrls: ['./item-scan-section.component.scss'],
})
export class ItemScanSectionComponent {

    @Input() disabled = true;

    @Output() itemScanned = new EventEmitter<string>();

    @ViewChild('itemInput') itemInputRef!: ElementRef<HTMLInputElement>;

    preview: ParsedItemQr | null = null;

    onEnter(event: any) {
        const value = event.target.value;
        event.target.value = '';
        this.itemScanned.emit(value);
    }

    onAddClick() {
        if (this.itemInputRef?.nativeElement) {
            const value = this.itemInputRef.nativeElement.value;
            this.itemInputRef.nativeElement.value = '';
            this.itemScanned.emit(value);
        }
    }

    setPreview(preview: ParsedItemQr | null) {
        this.preview = preview;
    }

    focusInput() {
        setTimeout(() => this.itemInputRef?.nativeElement?.focus(), 0);
    }
}
