import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BinconsolidationPage } from './bin-consolidation.page';

const routes: Routes = [
  {
    path: '',
    component: BinconsolidationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class  BinconsolidationRoutingModule {}
