import { Component, Input } from '@angular/core';
import { CurrentBoxItem } from '../../pre-binning.types';

export interface GroupedBoxItem {
    itemCode: string;
    type: string;
    qty: number;
}

@Component({
    selector: 'app-current-box-items-grid',
    templateUrl: './current-box-items-grid.component.html',
    styleUrls: ['./current-box-items-grid.component.scss'],
})
export class CurrentBoxItemsGridComponent {
    @Input() items: CurrentBoxItem[] = [];
    @Input() totalQty = 0;

    // Unique Number is backend-validation-only and must never surface here;
    // display groups by ItemCode + Type and sums Qty across the individual scans.
    get groupedItems(): GroupedBoxItem[] {
        const grouped = new Map<string, GroupedBoxItem>();
        for (const item of this.items || []) {
            const key = `${item.itemCode}_${item.type}`;
            const existing = grouped.get(key);
            if (existing) {
                existing.qty += item.qty;
            } else {
                grouped.set(key, { itemCode: item.itemCode, type: item.type, qty: item.qty });
            }
        }
        return Array.from(grouped.values());
    }
}
