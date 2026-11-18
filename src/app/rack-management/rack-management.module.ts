import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RackManagementPage } from './rack-management.page';
import { SharedModule } from '../shared/shared.module';
import { RackManagementPageRoutingModule } from './rack-management-routing.module';
import { RackScanSectionComponent } from './components/rack-scan-section/rack-scan-section.component';
import { RackItemScanSectionComponent } from './components/item-scan-section/item-scan-section.component';
import { ScannedItemsGridComponent } from './components/scanned-items-grid/scanned-items-grid.component';
import { RackStockGridComponent } from './components/rack-stock-grid/rack-stock-grid.component';
import { RackHistoryComponent } from './components/rack-history/rack-history.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RackManagementPageRoutingModule,
        SharedModule,
    ],
    declarations: [
        RackManagementPage,
        RackScanSectionComponent,
        RackItemScanSectionComponent,
        ScannedItemsGridComponent,
        RackStockGridComponent,
        RackHistoryComponent,
    ]
})
export class RackManagementPageModule { }
