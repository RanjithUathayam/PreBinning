import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../shared/shared.module';
import { Flashlight } from '@ionic-native/flashlight/ngx';
import { RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy } from '@ionic/angular';
import { BinconsolidationRoutingModule } from './bin-consolidation-routing.module';
import { BinconsolidationPage } from './bin-consolidation.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BinconsolidationRoutingModule, SharedModule,
    IonicModule.forRoot()
  ],
  providers: [
    Flashlight,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  declarations: [ BinconsolidationPage]
})
export class BinconsolidationPageModule { }
