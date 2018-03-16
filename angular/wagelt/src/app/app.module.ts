import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { MinWageComponent, NumberOnly } from './min-wage/min-wage.component';


@NgModule({
  declarations: [
    AppComponent,
    MinWageComponent,
    NumberOnly
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
