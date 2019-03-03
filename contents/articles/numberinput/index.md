---
title: Filtering input with angular2
author: pribluda
date: 2018-03-16
template: article.pug
lang: en
tags: angular, input, numeric, component, directive
description: filtering input with angular with regular expressions
---

In my [wage calulator](/tools/taxlt/)  I would like to recalculate values as user types them. But I would like to prevent user
from entering invalid numbers. 

<span class="more"></span>

Of course standart angular valudators work very well,   but only after input is done -  and then it is not always possible 
to recover. Better solution would  be to prevent user from entering BS in a first place. 

### Directive to  the rescue 

Of course,   first you have to google if there is already a good solution.  After some googling I found ons on [SO](https://stackoverflow.com/questions/41465542/angular2-input-field-to-accept-only-numbers) 
(the second one) - which was almost good.  However, I tried to make it better: 
 
 * configurable regex
 * text can be inserted not only on end
 
Out component shall intercept key down events,  and then check whether result still matches regular expression. If not -  cancel this event. 
Hooking to on update event was not an option, because it is not cancelable and thus wrong value will be alerady delieverd to 
other components    
 
So here we go:

````typescript
// directive will be bound  via attribute
@Directive({
  selector: "[numberOnly]"
})
export class NumberOnly implements OnInit {

  //  this list contains key codes of events we like to ignore here. we will be able to use arrow keys,  
  //  delete etc.  
  private specialKeys: Array<string> = ['Backspace', 'Tab', 'End', 'Home', 'Clear',
    'Copy', 'Control', 'Del', 'Shift', 'ArrowLeft', 'ArrowLeft'];
  
  //  externally configured regex - for numbers shall be:  /^[0-9]+(\.[0-9]*){0,1}$/g
  @Input() numberOnly: string;


  private regex: RegExp;

  constructor(private el: ElementRef) {
   }
   
   // initialise regex here, input parameters are not yet set while construction
  ngOnInit() {
       this.regex = new RegExp(this.numberOnly, "g");
  }
  //  and here happens everything 
  //  ... subscribe to keydown events
  @HostListener('keydown', ['$event']) onKeyDown(event) {
      // we are working with event.key here - as char atribute is deprecated
      // we exclude out special keys,  and all the specials. 
      if (this.specialKeys.indexOf(event.key) !== -1 || event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

  
  
      // current string in element
      let current: string = this.el.nativeElement.value;
      
      // compose what our text will become if we let it pass. 
      // Do not use event.keycode this is deprecated.
      // See: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
      // take selection  boundaries into consideration -  input replaces what is in between. 
      let next: string = current.substring(0, this.el.nativeElement.selectionStart) + event.key + current.substring(this.el.nativeElement.selectionEnd)

      //  if it does not match, we do not let it pass
      if (next && !String(next).match(this.regex)) {
        event.preventDefault();
      }
    }
  }

```` 

And we are done.  Now bind it into  template:
````html
    <div class="result">
      <input [ngModel]="calculator.sodraRateCompany * 100 |  number:'1.2-2'" placeholder="{{calculator.sodraRateCompany| number:'1.2-2'}}"
             numberOnly="^[0-9]+(\.[0-9]*){0,1}$"
             (ngModelChange)="updateSodraRateCompany($event)"
        >
    </div>
````

And [see how it works](/tools/taxlt/) [sources](https://github.com/ko5tik/pribluda.de/blob/master/angular/wagelt/src/app/min-wage/min-wage.component.ts)

Thanks to [omeralper](https://stackoverflow.com/users/2425396/omeralper) and [JeanPaul A.](https://stackoverflow.com/users/6666508/jeanpaul-a)
