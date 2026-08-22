import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../components/header/header.component';
import { PageheaderComponent } from '../components/pageheader/pageheader.component';

@NgModule({
  declarations: [HeaderComponent,PageheaderComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [HeaderComponent,PageheaderComponent]
})
export class SharedModule { }
