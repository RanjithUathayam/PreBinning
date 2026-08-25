import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PreBinningPage } from './pre-binning.page';

const routes: Routes = [
    {
        path: '',
        component: PreBinningPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PreBinningPageRoutingModule { }
