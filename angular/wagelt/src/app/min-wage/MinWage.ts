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
    this.wageNetto = this.wageBrutto - this.sodraAmountWorker - this.taxAmountWorker;
    this.companyTotal = this.wageBrutto + this.sodraAmountCompany;
  }

  /**
   * calculate starting from netto wage
   * @param {number} number
   */
  calulateFromNetto(number: number) {
    console.log('calc form netto: ' + number);
    //  netto % is 100 - tax - sodra worker
    this.wageNetto = this.roundMoney(number);
    this.wageBrutto = this.roundMoney(this.wageNetto / (1 - this.sodraRateWorker - this.taxRateWorker));
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
    return this.roundMoney(this.wageBrutto * this.taxRateWorker);
  }

  get percentState(): number {
    return this.roundMoney( this.wageNetto / this.companyTotal);
  }
}
