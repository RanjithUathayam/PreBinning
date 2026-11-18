import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { RackMode } from '../../rack-management.types';

@Component({
    selector: 'app-rm-item-scan-section',
    templateUrl: './item-scan-section.component.html',
    styleUrls: ['./item-scan-section.component.scss'],
})
export class RackItemScanSectionComponent {

    @Input() disabled = false;
    @Input() scanning = false;
    @Input() mode: RackMode = 'STORE';

    @Output() itemScanned = new EventEmitter<string>();

    @ViewChild('itemInput') itemInputRef!: ElementRef<HTMLInputElement>;

    onEnter(event: any) {
        const value = event.target.value;
        event.target.value = '';
        this.itemScanned.emit(value);
    }

    onScanButtonClick() {
        if (this.itemInputRef?.nativeElement) {
            const value = this.itemInputRef.nativeElement.value;
            this.itemInputRef.nativeElement.value = '';
            this.itemScanned.emit(value);
        }
    }

    focusInput() {
        setTimeout(() => this.itemInputRef?.nativeElement?.focus(), 0);
    }
}
