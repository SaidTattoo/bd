import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityUsersComponent } from './activity-users.component';

describe('ActivityUsersComponent', () => {
  let component: ActivityUsersComponent;
  let fixture: ComponentFixture<ActivityUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityUsersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
