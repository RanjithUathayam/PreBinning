import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EmptybinPage } from './emptybin.page';

const routes: Routes = [
  {
    path: '',
    component: EmptybinPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmptybinRoutingModule {}
