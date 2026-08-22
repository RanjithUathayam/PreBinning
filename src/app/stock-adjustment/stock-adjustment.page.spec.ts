import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StockAdjustmentPage } from './stock-adjustment.page';

describe('StockAdjustmentPage', () => {
  let component: StockAdjustmentPage;
  let fixture: ComponentFixture<StockAdjustmentPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(StockAdjustmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
 