import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then( m => m.DashboardPageModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'storein',
    loadChildren: () => import('./storein/storein.module').then( m => m.StoreinPagePageModule)
  },

  {
    path: 'storestatus',
    loadChildren: () => import('./storestatus/storestatus.module').then( m => m.StoreStausPageModule)
  },

  {
    path: 'emptybin',
    loadChildren: () => import('./empty-bin/emptybin.module').then( m => m.EmptybinPagePageModule)
  },

  {
    path: 're-filling',
    loadChildren: () => import('./bin-consolidation/bin-consolidation.module').then( m => m.BinconsolidationPageModule)
  },
  {
    path: 'stock-adjustment',
    loadChildren: () => import('./stock-adjustment/stock-adjustment.module').then( m => m.StockAdjustmentPageModule)
  },
  {
    path: 'pre-binning',
    loadChildren: () => import('./pre-binning/pre-binning.module').then( m => m.PreBinningPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
