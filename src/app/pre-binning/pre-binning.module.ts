import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PreBinningPage } from './pre-binning.page';
import { SharedModule } from '../shared/shared.module';
import { PreBinningPageRoutingModule } from './pre-binning-routing.module';
import { BoxScanSectionComponent } from './components/box-scan-section/box-scan-section.component';
import { ItemScanSectionComponent } from './components/item-scan-section/item-scan-section.component';
import { WarehouseStockGridComponent } from './components/warehouse-stock-grid/warehouse-stock-grid.component';
import { CurrentBoxItemsGridComponent } from './components/current-box-items-grid/current-box-items-grid.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PreBinningPageRoutingModule,
        SharedModule,
    ],
    declarations: [
        PreBinningPage,
        BoxScanSectionComponent,
        ItemScanSectionComponent,
        WarehouseStockGridComponent,
        CurrentBoxItemsGridComponent,
    ]
})
export class PreBinningPageModule { }
