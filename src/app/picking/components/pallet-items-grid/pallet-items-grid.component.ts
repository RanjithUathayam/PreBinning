import { Component, Input } from '@angular/core';
import { PickItemLine } from '../../picking.types';

@Component({
    selector: 'app-pk-pallet-items-grid',
    templateUrl: './pallet-items-grid.component.html',
    styleUrls: ['./pallet-items-grid.component.scss'],
})
export class PalletItemsGridComponent {
    @Input() items: PickItemLine[] = [];

    get pickedCount(): number {
        return this.items.filter((i) => i.pickingStatus === 'PICKED').length;
    }
}
