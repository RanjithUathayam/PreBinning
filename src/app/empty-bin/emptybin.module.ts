import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { EmptybinPage } from './emptybin.page';
import { SharedModule } from '../shared/shared.module';
import { EmptybinRoutingModule } from './emptybin-routing.module';
import { Flashlight } from '@ionic-native/flashlight/ngx';
import { RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy } from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EmptybinRoutingModule, SharedModule,
    IonicModule.forRoot()
  ],
  providers: [
    Flashlight,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  declarations: [EmptybinPage]
})
export class EmptybinPagePageModule { }
