import {Component, Input, OnInit, Output} from '@angular/core';
import {MinWage} from './MinWage';


@Component({
  selector: 'app-min-wage',
  templateUrl: './min-wage.component.html',
  styleUrls: ['./min-wage.component.css']
})

export class MinWageComponent implements OnInit {
  // create basic calculator
  calculator: MinWage;
  // input wage to be paid for worker before taxes
  @Input() @Output() private _bruttoWage: number;
  // input wage to be taken home
  @Input() private _nettoWage: number;
  // input total cost to company
  @Input() private _totalCost: number;
  // sodra rate to be paid by company
  @Input() private _sodraRateCompany: number;

  constructor() {
    this.calculator = new MinWage(
      0.09, // sodra part of worker at 9%
      0.3098, // sodra paid  by company,  alternative 0.317
      0.15, // income tax flat rate
      400 // configured minimal wage.  can be changed later
    );
    this.calculator.calulateFromBrutto(400);
  }


  get nettoWage(): number {
    return this._nettoWage;
  }

  get totalCost(): number {
    return this._totalCost;
  }

  get sodraRateCompany(): number {
    return this._sodraRateCompany;
  }

  set sodraRateCompany(value: number) {
    console.log('sodra rate set');
    this._sodraRateCompany = value;
    this.calculator.sodraRateCompany = this._sodraRateCompany / 100;
    this.calculator.calulateFromBrutto(this._bruttoWage);
  }


  set nettoWage(value: number) {
    this._nettoWage = value;
  }

  set totalCost(value: number) {
    this._totalCost = value;
  }

  ngOnInit() {
  }

  updateBrutto(brutto: any) {
    console.log('brutto ' + brutto);
    this.calculator.calulateFromBrutto( +brutto );
  }

  updateNetto(netto: any) {
    console.log('netto ' + netto);
    this.calculator.calulateFromNetto( +netto );
  }

  updateTotal(total: any) {
    console.log('total ' + total);
    this.calculator.calulateFromTotal( +total );
  }
}
