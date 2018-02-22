import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MinWageComponent } from './min-wage.component';

describe('MinWageComponent', () => {
  let component: MinWageComponent;
  let fixture: ComponentFixture<MinWageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MinWageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MinWageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
