import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { NoKeyboardModule } from 'ionic-no-keyboard';
import { Flashlight } from '@ionic-native/flashlight/ngx';
import {StoreinPage} from '../app/storein/storein.page'
import { StoreStausPage } from './storestatus/storestatus.page';
import { EmptybinPage } from './empty-bin/emptybin.page';
import { BinconsolidationPage } from './bin-consolidation/bin-consolidation.page';


@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, NoKeyboardModule],
  providers: [
    Flashlight,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    StoreinPage,
    StoreStausPage,
    EmptybinPage,
    BinconsolidationPage
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent],
})
export class AppModule { 

}
