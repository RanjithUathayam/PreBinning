import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LocationMappingPage } from './location-mapping.page';
import { SharedModule } from '../shared/shared.module';
import { LocationMappingPageRoutingModule } from './location-mapping-routing.module';
import { LocationSelectSectionComponent } from './components/location-select-section/location-select-section.component';
import { PalletScanSectionComponent } from './components/pallet-scan-section/pallet-scan-section.component';
import { RecentMappingsGridComponent } from './components/recent-mappings-grid/recent-mappings-grid.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        LocationMappingPageRoutingModule,
        SharedModule,
    ],
    declarations: [
        LocationMappingPage,
        LocationSelectSectionComponent,
        PalletScanSectionComponent,
        RecentMappingsGridComponent,
    ]
})
export class LocationMappingPageModule { }
