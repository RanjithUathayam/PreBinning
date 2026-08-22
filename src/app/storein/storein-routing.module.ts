import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StoreinPage } from './storein.page';

const routes: Routes = [
  {
    path: '',
    component: StoreinPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StoreinPageRoutingModule {}
