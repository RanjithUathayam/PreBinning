import { Component, Input } from '@angular/core';
import { CurrentPalletBox } from '../../pallet-mapping.types';

@Component({
    selector: 'app-current-pallet-boxes-grid',
    templateUrl: './current-pallet-boxes-grid.component.html',
    styleUrls: ['./current-pallet-boxes-grid.component.scss'],
})
export class CurrentPalletBoxesGridComponent {
    @Input() boxes: CurrentPalletBox[] = [];
}
