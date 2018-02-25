export class MinWage {


  public wageBrutto: number;
  public wageNetto: number;
  public companyTotal: number;


  public constructor(public sodraRateWorker: number, // sodra paid  by worker
                     public sodraRateCompany: number, // sodra paid  by company,  alternative 0.317
                     public taxRateWorker: number, // income tax flat rate
                     public minimalWage: number // configured minimal wage.  can be changed later
  ) {
    this.wageBrutto = minimalWage;
  }

  // calculate  all the payments from brutto wage
  calulateFromBrutto(number: number) {
    console.log('called calc form brutto: ' + number);
    this.wageBrutto = this.roundMoney(number);
    this.wageNetto = this.roundMoney(this.wageBrutto - this.sodraAmountWorker - this.taxAmountWorker);
    this.companyTotal = this.wageBrutto + this.sodraAmountCompany;
  }

  /**
   * calculate starting from netto wage
   * @param {number} number
   */
  calulateFromNetto(number: number) {
    console.log('calc form netto: ' + number);
    //  netto % is 100 - tax - sodra workercase
    this.wageNetto = this.roundMoney(number);

    // take into account non taxable minimum
    // this is non taxable amount with SODRA9% taken out
    if (this.wageNetto < 345.8) {
      // no taxes in this, bus sodra still taken off this
      this.wageBrutto = this.roundMoney(this.wageNetto / (1 - this.sodraRateWorker));
      console.log("under taxable minimum, brutto:" + this.wageBrutto);
    } else if(this.wageNetto < 361) {
      //  we have  still 380 eur non taxable minimum,  so calc formula is
      //  b = ( n - 57 ) / 0.76
      this.wageBrutto = this.roundMoney((this.wageNetto -57) / 0.76);
      console.log("max taxable minimum, brutto:" + this.wageBrutto);
    } else if (this.wageNetto >= 881.6) {
      // cut out for non taxable amount if 1160 bruto, corresponds to 881.6 netto
      // non taxable minimum no longer apply
      this.wageBrutto = this.roundMoney(this.wageNetto / (1 - this.sodraRateWorker - this.taxRateWorker));
      console.log("non taxable not applies, brutto:" + this.wageBrutto);
    } else {
      // after much calculation I came to the formula b= (n-01.5*580)/ 0.685
      this.wageBrutto = this.roundMoney((this.wageNetto - 87) / 0.685);
      console.log("non taxable minimum applies , brutto:" + this.wageBrutto);
    }
    this.companyTotal = this.roundMoney(this.wageBrutto + this.sodraAmountCompany);
  }

  calulateFromTotal(number: number) {
    console.log('calc form total: ' + number);
    this.companyTotal = this.roundMoney(number);
    this.wageBrutto = this.roundMoney(this.companyTotal * (1 - this.sodraRateCompany));
    this.wageNetto = this.roundMoney(this.wageBrutto - this.sodraAmountWorker - this.taxAmountWorker);
  }

  roundMoney(money: number): number {
    return Math.round(money * 100) / 100;
  }


  get sodraAmountWorker(): number {
    return this.roundMoney(this.wageBrutto * this.sodraRateWorker);
  }

  get sodraAmountCompany(): number {
    return this.roundMoney(this.wageBrutto * this.sodraRateCompany);
  }

  get taxAmountWorker(): number {
    var n = this.npd;

    // we are below minimum,  nothing to pay here
    if (this.wageBrutto < n) {
      return 0;
    }
    // otherwise we pull out NPD,  when we have too much momey it goes against 0
    return this.roundMoney((this.wageBrutto - n) * this.taxRateWorker);
  }

  get percentState(): number {
    return this.roundMoney(this.wageNetto / this.companyTotal);
  }

  /**
   * non taxable minimum -  380 below 400,   sinks to 0 at 1160
   * @returns {number}
   */

  get npd(): number {
    if (this.wageBrutto < 400) {
      return 380;
    }
    var nn = 380 - 0.5 * (this.wageBrutto - 400);
    return nn > 0 ? nn : 0;
  }

  get taxableAmount(): number {
    return this.wageBrutto < 380 ? 0 : this.wageBrutto - this.npd;
  }
}
