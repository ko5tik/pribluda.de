import {
  Component, Directive, ElementRef, HostListener, Input, OnInit, Output, Renderer,
  Renderer2
} from '@angular/core';
import {MinWage} from './MinWage';


@Component({
  selector: 'app-min-wage',
  templateUrl: './min-wage.component.html',
  styleUrls: ['./min-wage.component.css']
})

export class MinWageComponent implements OnInit {
  // create basic calculator
  calculator: MinWage;


  constructor() {
    this.calculator = new MinWage(
      0.09, // sodra part of worker at 9%
      0.3098, // sodra paid  by company,  alternative 0.317
      0.15, // income tax flat rate
      400, // configured minimal wage.  can be changed later,
      true,
      false
    );
    this.calculator.calulateFromBrutto(400);
  }


  ngOnInit() {
  }

  updateBrutto(brutto: any) {
    console.log('brutto ' + brutto);
    this.calculator.calulateFromBrutto(+brutto);
  }

  updateNetto(netto: any) {
    console.log('netto ' + netto);
    this.calculator.calulateFromNetto(+netto);
  }

  updateTotal(total: any) {
    //console.log('total ' + total);
    this.calculator.calulateFromTotal(+total);
  }

  setNonTaxableMinimum(value: boolean) {
    //console.log('non taxable set' + value);
    this.calculator.useNonTaxableMinimum = value;
    this.calculator.calulateFromBrutto(this.calculator.wageBrutto);
  }

  updateSodraRateCompany(rate: any) {
    //console.log('sodra rate set' + rate);
    this.calculator.sodraRateCompany = +rate / 100;
  }

  setVoluntaryRent(value: boolean) {
    this.calculator.useVoluntaryRent = value;
    this.calculator.calulateFromBrutto(this.calculator.wageBrutto);
  }
}

// directive allowing only numbers and .
@Directive({
  selector: "[numberOnly]"
})
export class NumberOnly implements OnInit {

  private specialKeys: Array<string> = ['Backspace', 'Tab', 'End', 'Home', 'Clear',
    'Copy', 'Control', 'Del', 'Shift', 'ArrowLeft', 'ArrowLeft'];


  //  externally configured regex /^[0-9]+(\.[0-9]*){0,1}$/g
  @Input() numberOnly: string = "^[0-9]+(\\.[0-9]*){0,1}$";
  private oldValue = "";

  private regex: RegExp;

  constructor(private el: ElementRef,
              private render: Renderer2) {
  }

  // initialisse regex here
  ngOnInit() {
    //console.log("create regex from:" + this.numberOnly);
    this.regex = new RegExp(this.numberOnly, "g");
  }


  @HostListener('keydown', ['$event']) onKeyDown(event) {
    // bypass specials, controls and alts
    if (this.specialKeys.indexOf(event.key) !== -1 || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }
    //console.log("event fired " + event.key);


    // Do not use event.keycode this is deprecated.
    // See: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
    let current: string = this.el.nativeElement.value;

    //console.log("selection:" + this.el.nativeElement.selectionStart + "-" + this.el.nativeElement.selectionEnd);
    // compose what out gtext will become if we let it pass
    let next: string = current.substring(0, this.el.nativeElement.selectionStart) + event.key + current.substring(this.el.nativeElement.selectionEnd)
    //console.log("next: " + next);
    //  if it does not mapth, we do not let it pass
    if (next && !String(next).match(this.regex)) {
      event.preventDefault();
    }


  }
}
