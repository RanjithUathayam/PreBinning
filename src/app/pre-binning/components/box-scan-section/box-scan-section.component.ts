import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'app-box-scan-section',
    templateUrl: './box-scan-section.component.html',
    styleUrls: ['./box-scan-section.component.scss'],
})
export class BoxScanSectionComponent {

    @Input() disabled = false;
    @Input() placeholder = 'Scan / Enter Box QR';
    @Input() boxNumber: string | null = null;
    @Input() itemGroup: string | null = null;
    @Input() qty = 0;
    @Input() status = '';

    @Output() boxScanned = new EventEmitter<string>();

    @ViewChild('boxInput') boxInputRef!: ElementRef<HTMLInputElement>;

    onEnter(event: any) {
        const value = event.target.value;
        event.target.value = '';
        this.boxScanned.emit(value);
    }

    onScanButtonClick() {
        if (this.boxInputRef?.nativeElement) {
            const value = this.boxInputRef.nativeElement.value;
            this.boxInputRef.nativeElement.value = '';
            this.boxScanned.emit(value);
        }
    }

    focusInput() {
        setTimeout(() => this.boxInputRef?.nativeElement?.focus(), 0);
    }
}
