import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PositionOption, RowOption, WarehouseOption } from '../../location-mapping.types';

@Component({
    selector: 'app-location-select-section',
    templateUrl: './location-select-section.component.html',
    styleUrls: ['./location-select-section.component.scss'],
})
export class LocationSelectSectionComponent {

    @Input() disabled = false;
    @Input() warehouseList: WarehouseOption[] = [];
    @Input() rowList: RowOption[] = [];
    @Input() positionList: PositionOption[] = [];
    @Input() loadingWarehouses = false;
    @Input() loadingRows = false;
    @Input() loadingPositions = false;
    @Input() selectedWarehouse: string | null = null;
    @Input() selectedRow: string | null = null;
    @Input() selectedLocationCode: string | null = null;

    @Output() warehouseChange = new EventEmitter<string>();
    @Output() rowChange = new EventEmitter<string>();
    @Output() positionChange = new EventEmitter<string>();

    onWarehouseChange(value: string) {
        this.warehouseChange.emit(value);
    }

    onRowChange(value: string) {
        this.rowChange.emit(value);
    }

    onPositionChange(value: string) {
        this.positionChange.emit(value);
    }
}
