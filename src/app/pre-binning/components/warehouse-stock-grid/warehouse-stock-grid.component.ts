import { Component, Input } from '@angular/core';
import { WarehouseStockItem } from '../../pre-binning.types';

@Component({
    selector: 'app-warehouse-stock-grid',
    templateUrl: './warehouse-stock-grid.component.html',
    styleUrls: ['./warehouse-stock-grid.component.scss'],
})
export class WarehouseStockGridComponent {
    @Input() stock: WarehouseStockItem[] = [];
    @Input() loading = false;
    @Input() noDataMessage = 'No stock data available.';
}
