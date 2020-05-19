import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { FormGroup, FormControl } from "@angular/forms";

import { EmployeeService } from "../../shared/services/users/employee.service";
import { ShiftService } from "../../shared/services/shift/shift.service";
import { ScheduledService } from "../../shared/services/shift/scheduled.service";
import { PreferredService } from "src/app/shared/services/shift/preferred.service";
import { Employee } from "../../shared/models/users/employee.model";
import { Shift } from "../../shared/models/shift/shift.model";
import {
  CalendarItem,
  CalendarItemEmit,
} from "../../shared/models/custom-types";
import { ShiftProperties } from "../../shared/tools/custom-classes";
import { ScheduledData } from "../../shared/models/shift/scheduled.model";
import {
  Preferred,
  PreferredData,
} from "../../shared/models/shift/preferred.model";

//FROM dashboard TO [calendar-item | week-item | day-item]
@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private employeeSub: Subscription;
  private calendarItemSub: Subscription;
  private myPreferredSub: Subscription;

  @Input() employeeIsAuth;
  @Input() schedulerIsAuth;
  @Input() calendarItemObs: Observable<any>;
  @Input() myPreferredObs: Observable<any>;

  @Output() employeeEmitter = new EventEmitter<
    [string, CalendarItem, Preferred]
  >();
  @Output() schedulerEmitter = new EventEmitter<[string, CalendarItem]>();

  employees: Employee[];
  calendarItem: CalendarItem;
  calendarItemId: string;
  calendarItemDay: moment.Moment;
  myPreferred: Preferred;
  addPreferredForm: FormGroup;
  updateShiftForm: FormGroup;
  createScheduledForm: FormGroup;

  employeeOptionsMenu = false;
  schedulerOptionsMenu = false;
  addPreferredFormToggle = false;
  updateShiftFormToggle = false;
  createScheduledFormToggle = false;

  //UPDATE SHIFT FORM
  positions = ShiftProperties.positions;
  slots = ShiftProperties.slots;
  locations = ShiftProperties.locations;
  days = ShiftProperties.days;
  shiftHours = ShiftProperties.shiftHours;

  //ADD PREFERRED FORM
  ranks = [1, 2, 3];

  constructor(
    private employeeService: EmployeeService,
    private shiftService: ShiftService,
    private scheduledService: ScheduledService,
    private preferredService: PreferredService
  ) {}

  ngOnInit() {
    //1. GRAB CALENDAR ITEM INFO FROM PARENT [calendar | week | day] OBS
    this.calendarItemSub = this.calendarItemObs.subscribe(
      (emittedData: CalendarItemEmit) => {
        this.calendarItem = [emittedData[0], emittedData[1]];
        this.calendarItemId = emittedData[0].id;
        this.calendarItemDay = emittedData[2];

        //2. OPEN CORRESPONDING MENU
        if (this.employeeIsAuth) this.onToggleEmployeeOptionsMenu(`open`);
        if (this.schedulerIsAuth) this.onToggleSchedulerOptionsMenu(`open`);
      }
    );

    //3. GRAB MY PREFERRED IF EMPLOYEE IS AUTH
    if (this.employeeIsAuth) {
      this.myPreferredSub = this.myPreferredObs.subscribe(
        (emittedData: Preferred) => (this.myPreferred = emittedData)
      );
    }
  }

  //----------------------FOR EMPLOYEE USE
  //TOOLS----------------------------------------------------------

  onEmployeeEmitter(type: `deletePreferred` | `requestVacation`) {
    const data = this.calendarItem;

    this.employeeEmitter.emit([type, data, this.myPreferred]);

    if (this.employeeOptionsMenu) this.onToggleEmployeeOptionsMenu(`close`);
  }

  onToggleEmployeeOptionsMenu(type: `open` | `close`) {
    type === `open`
      ? (this.employeeOptionsMenu = true)
      : (this.employeeOptionsMenu = false);
  }

  onToggleAddPreferredForm(type: `open` | `close`) {
    type === `open`
      ? this.initAddPreferredForm()
      : (this.addPreferredFormToggle = false);
  }

  //----------------------FOR SCHEDULER USE
  //TOOLS----------------------------------------------------------

  onSchedulerEmitter(type: `deleteShift` | `deleteScheduled`) {
    const data = this.calendarItem;

    this.schedulerEmitter.emit([type, data]);

    if (this.schedulerOptionsMenu) this.onToggleSchedulerOptionsMenu(`close`);
  }

  onToggleSchedulerOptionsMenu(type: `open` | `close`) {
    type === `open`
      ? (this.schedulerOptionsMenu = true)
      : (this.schedulerOptionsMenu = false);
  }

  onToggleUpdateShiftForm(type: `open` | `close`) {
    type === `open`
      ? this.initUpdateShiftForm()
      : (this.updateShiftFormToggle = false);
  }

  onToggleCreateScheduledForm(type: `open` | `close`) {
    type === `open`
      ? this.initCreateScheduledForm()
      : (this.createScheduledFormToggle = false);
  }

  //----------------------FOR EMPLOYEE USE
  //ADD PREFERRED FORM----------------------------------------------------------

  initAddPreferredForm() {
    //1. INITIALIZE PREFERRED FORM
    this.addPreferredForm = new FormGroup({
      rankControl: new FormControl(null),
    });

    //2. EXPOSE PREFERRED DATA IF ANY FOR DISPLAY AND PLUG IN
    //   EXISTING VALUES FOR FORM
    if (this.myPreferred !== null)
      this.addPreferredForm.controls["rankControl"].setValue(
        this.myPreferred.rank
      );

    //3. DISPLAY FORM
    this.addPreferredFormToggle = true;
  }

  onAddPreferred() {
    if (this.addPreferredForm.invalid) return;

    const preferred: PreferredData = {
      shift: this.calendarItem[0].id,
      rank: this.addPreferredForm.value.rankControl,
    };

    if (this.myPreferred) {
      this.preferredService
        .updateMyPreferred(this.myPreferred.id, preferred)
        .subscribe(() => location.reload());
    } else {
      this.preferredService
        .saveMyPreferred(preferred)
        .subscribe(() => location.reload());
    }
  }

  //----------------------FOR SCHEDULER USE
  //UPDATE SHIFT FORM----------------------------------------------------------

  initUpdateShiftForm() {
    //1. INITIALIZE SHIFT FORM
    this.updateShiftForm = new FormGroup({
      positionControl: new FormControl(null),
      slotControl: new FormControl(null),
      locationControl: new FormControl(null),
      dayControl: new FormControl(null),
      shiftStartControl: new FormControl(null),
      shiftEndControl: new FormControl(null),
    });

    //2. EXPOSE SHIFT DATA FOR DISPLAY AND PLUG IN
    //   EXISTING VALUES FOR FORM
    this.updateShiftForm.controls["positionControl"].setValue(
      this.calendarItem[0].position
    );
    this.updateShiftForm.controls["slotControl"].setValue(
      this.calendarItem[0].slot
    );
    this.updateShiftForm.controls["locationControl"].setValue(
      this.calendarItem[0].location
    );
    this.updateShiftForm.controls["dayControl"].setValue(
      this.calendarItem[0].day
    );
    this.updateShiftForm.controls["shiftStartControl"].setValue(
      this.calendarItem[0].shiftStart[0]
    );
    this.updateShiftForm.controls["shiftEndControl"].setValue(
      this.calendarItem[0].shiftEnd[0]
    );

    //3. DISPLAY FORM
    this.updateShiftFormToggle = true;
  }

  onUpdateShift() {
    if (this.updateShiftForm.invalid) return;

    const shiftData: Shift = {
      position: this.updateShiftForm.value.positionControl,
      slot: this.updateShiftForm.value.slotControl,
      location: this.updateShiftForm.value.locationControl,
      day: this.updateShiftForm.value.dayControl,
      shiftStart: [this.updateShiftForm.value.shiftStartControl, 0],
      shiftEnd: [this.updateShiftForm.value.shiftEndControl, 0],
    };

    this.shiftService
      .updateShift(this.calendarItemId, shiftData)
      .subscribe(() => location.reload());
  }

  //----------------------FOR SCHEDULER USE
  //CREATE SCHEDULED FORM----------------------------------------------------------

  getEmployees() {
    this.employeeSub = this.employeeService
      .getAllEmployees()
      .subscribe((employees: Employee[]) => (this.employees = employees));
  }

  initCreateScheduledForm() {
    this.getEmployees();

    //1. INITIALIZE SCHEDULED FORM
    this.createScheduledForm = new FormGroup({
      employeeControl: new FormControl(null),
    });

    //2. EXPOSE SCHEDULED DATA IF ANY FOR DISPLAY AND PLUG IN
    //   EXISTING VALUES FOR FORM
    if (this.calendarItem[1] !== null)
      this.createScheduledForm.controls["employeeControl"].setValue(
        this.calendarItem[1].employee.id
      );

    //3. DISPLAY FORM
    this.createScheduledFormToggle = true;
  }

  onCreateScheduled() {
    if (this.createScheduledForm.invalid) return;

    const scheduledData: ScheduledData = {
      shift: this.calendarItemId,
      employee: this.createScheduledForm.value.employeeControl,
      date: this.calendarItemDay.toISOString(),
    };

    this.scheduledService
      .createScheduled(scheduledData)
      .subscribe(() => location.reload());
  }

  ngOnDestroy() {
    if (this.employeeSub) this.employeeSub.unsubscribe();
    if (this.calendarItemSub) this.calendarItemSub.unsubscribe();
    if (this.myPreferredSub) this.myPreferredSub.unsubscribe();
  }
}
