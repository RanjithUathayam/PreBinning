import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'app-pm-box-scan-section',
    templateUrl: './box-scan-section.component.html',
    styleUrls: ['./box-scan-section.component.scss'],
})
export class BoxScanSectionComponent {

    @Input() disabled = true;
    @Input() scanning = false;

    @Output() boxScanned = new EventEmitter<string>();

    @ViewChild('boxInput') boxInputRef!: ElementRef<HTMLInputElement>;

    onEnter(event: any) {
        const value = event.target.value;
        event.target.value = '';
        this.boxScanned.emit(value);
    }

    onAddClick() {
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
