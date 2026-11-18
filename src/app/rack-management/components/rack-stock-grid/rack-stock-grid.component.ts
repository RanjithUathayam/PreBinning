import { Component, Input } from '@angular/core';
import { RackStockLine } from '../../rack-management.types';

@Component({
    selector: 'app-rm-rack-stock-grid',
    templateUrl: './rack-stock-grid.component.html',
    styleUrls: ['./rack-stock-grid.component.scss'],
})
export class RackStockGridComponent {

    @Input() rackCode: string | null = null;
    @Input() stock: RackStockLine[] = [];
    @Input() totalQty = 0;
}
