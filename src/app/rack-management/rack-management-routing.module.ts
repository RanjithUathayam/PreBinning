import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RackManagementPage } from './rack-management.page';

const routes: Routes = [
    {
        path: '',
        component: RackManagementPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class RackManagementPageRoutingModule { }
