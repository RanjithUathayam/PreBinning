import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StockAdjustmentPage } from './stock-adjustment.page';

const routes: Routes = [
  {
    path: '',
    component: StockAdjustmentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StockAdjustmentPageRoutingModule {}
