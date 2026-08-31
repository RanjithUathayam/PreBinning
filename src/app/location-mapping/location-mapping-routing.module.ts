import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LocationMappingPage } from './location-mapping.page';

const routes: Routes = [
    {
        path: '',
        component: LocationMappingPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class LocationMappingPageRoutingModule { }
