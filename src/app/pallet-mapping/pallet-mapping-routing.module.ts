import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PalletMappingPage } from './pallet-mapping.page';

const routes: Routes = [
    {
        path: '',
        component: PalletMappingPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PalletMappingPageRoutingModule { }
