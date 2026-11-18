import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RackMode, RackScanLine } from '../../rack-management.types';

@Component({
    selector: 'app-rm-scanned-items-grid',
    templateUrl: './scanned-items-grid.component.html',
    styleUrls: ['./scanned-items-grid.component.scss'],
})
export class ScannedItemsGridComponent {

    @Input() mode: RackMode = 'STORE';
    @Input() rackCode: string | null = null;
    @Input() lines: RackScanLine[] = [];
    @Input() lineErrors: { [key: string]: string } = {};
    @Input() projectedQtyByItem: { [itemCode: string]: number } = {};
    @Input() totalQty = 0;
    @Input() canSave = false;
    @Input() saving = false;

    @Output() qtyChange = new EventEmitter<{ line: RackScanLine; qty: number }>();
    @Output() removeLine = new EventEmitter<RackScanLine>();
    @Output() save = new EventEmitter<void>();
    @Output() clear = new EventEmitter<void>();

    trackByKey(_index: number, line: RackScanLine): string {
        return line.key;
    }

    onQtyChange(line: RackScanLine, rawValue: string) {
        this.qtyChange.emit({ line, qty: Number(rawValue) });
    }
}
