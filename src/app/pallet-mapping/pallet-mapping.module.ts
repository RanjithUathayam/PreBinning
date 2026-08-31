import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PalletMappingPage } from './pallet-mapping.page';
import { SharedModule } from '../shared/shared.module';
import { PalletMappingPageRoutingModule } from './pallet-mapping-routing.module';
import { PalletScanSectionComponent } from './components/pallet-scan-section/pallet-scan-section.component';
import { BoxScanSectionComponent } from './components/box-scan-section/box-scan-section.component';
import { CurrentPalletBoxesGridComponent } from './components/current-pallet-boxes-grid/current-pallet-boxes-grid.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PalletMappingPageRoutingModule,
        SharedModule,
    ],
    declarations: [
        PalletMappingPage,
        PalletScanSectionComponent,
        BoxScanSectionComponent,
        CurrentPalletBoxesGridComponent,
    ]
})
export class PalletMappingPageModule { }
