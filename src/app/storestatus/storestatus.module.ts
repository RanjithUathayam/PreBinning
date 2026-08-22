import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StoreStatusPageRoutingModule } from './storestatus-routing.module';

import { StoreStausPage } from './storestatus.page';
import { SharedModule } from "../shared/shared.module";

@NgModule({
    declarations: [StoreStausPage],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        StoreStatusPageRoutingModule,
        SharedModule
    ]
})
export class StoreStausPageModule {}
