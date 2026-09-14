import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PickingPage } from './picking.page';
import { SharedModule } from '../shared/shared.module';
import { PickingPageRoutingModule } from './picking-routing.module';
import { PickingPalletScanSectionComponent } from './components/pallet-scan-section/pallet-scan-section.component';
import { PickingBoxScanSectionComponent } from './components/box-scan-section/box-scan-section.component';
import { BoxItemsGridComponent } from './components/box-items-grid/box-items-grid.component';
import { PalletItemsGridComponent } from './components/pallet-items-grid/pallet-items-grid.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PickingPageRoutingModule,
        SharedModule,
    ],
    declarations: [
        PickingPage,
        PickingPalletScanSectionComponent,
        PickingBoxScanSectionComponent,
        BoxItemsGridComponent,
        PalletItemsGridComponent,
    ]
})
export class PickingPageModule { }
