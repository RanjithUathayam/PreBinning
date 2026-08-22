import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { IonicModule } from '@ionic/angular';

import { StockAdjustmentPageRoutingModule } from './stock-adjustment-routing.module'; 

import { StockAdjustmentPage } from './stock-adjustment.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    StockAdjustmentPageRoutingModule
  ],
  declarations: [StockAdjustmentPage]
})
export class StockAdjustmentPageModule {}
