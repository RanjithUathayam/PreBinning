import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PickItemLine } from '../../picking.types';

@Component({
    selector: 'app-pk-box-items-grid',
    templateUrl: './box-items-grid.component.html',
    styleUrls: ['./box-items-grid.component.scss'],
})
export class BoxItemsGridComponent implements OnChanges {

    @Input() boxNumber: string | null = null;
    @Input() items: PickItemLine[] = [];
    @Input() scanning = false;
    @Input() boxRemainingQty: number | null = null;
    @Input() boxPickingStatus: string | null = null;

    @Output() pickItem = new EventEmitter<{ item: PickItemLine; pickedQuantity: number }>();

    qtyByInventoryId: { [inventoryId: number]: number } = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['items']) {
            (this.items || []).forEach((item) => {
                if (this.qtyByInventoryId[item.inventoryId] === undefined) {
                    this.qtyByInventoryId[item.inventoryId] = item.pickableQty;
                }
            });
        }
    }

    canPick(item: PickItemLine): boolean {
        return item.pickingStatus === 'PENDING' && item.pickableQty > 0;
    }

    isQtyValid(item: PickItemLine): boolean {
        const qty = this.qtyByInventoryId[item.inventoryId];
        return Number.isFinite(qty) && qty > 0 && qty <= item.pickableQty;
    }

    onQtyChange(item: PickItemLine, rawValue: string) {
        this.qtyByInventoryId[item.inventoryId] = Number(rawValue);
    }

    onPickClick(item: PickItemLine) {
        if (this.scanning || !this.canPick(item) || !this.isQtyValid(item)) {
            return;
        }
        this.pickItem.emit({ item, pickedQuantity: this.qtyByInventoryId[item.inventoryId] });
    }
}
