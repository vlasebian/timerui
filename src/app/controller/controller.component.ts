import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators, FormGroupDirective } from '@angular/forms';

import { Socket } from 'ngx-socket-io';
import { Timer } from '../model/timer';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-controller',
  templateUrl: './controller.component.html',
  styleUrls: ['./controller.component.scss']
})
export class ControllerComponent implements OnInit, OnDestroy {
  event = 'bestem';
  state = 'UNDEFINED';
  enddate = null;
  countdown = null;
  clock = {
    t: 0,
    d: 0,
    h: 0,
    m: 0,
    s: 0,
  }
  setForm: FormGroup = null;

  // Event listeners.
  timer = this.socket.fromEvent<Timer>('timer')
    .subscribe(timer => {
      this.state = timer.state.toUpperCase();
      this.enddate = timer.enddate;

      this.updateClock(this);

      if (this.state === 'ACTIVE') {
        this.countdown = setInterval(() => { this.updateClock(this) }, 1000);
      } else if (this.countdown != null) {
        clearInterval(this.countdown);
      }

    });

  error = this.socket.fromEvent<Timer>('err')
    .subscribe(error => {
      console.log(error);
    });
    
  @ViewChild(FormGroupDirective, {static: false}) formGroupDirective: FormGroupDirective;

  constructor(
    private socket: Socket,
    public auth: AuthService,
    ) { }

  ngOnInit(): void {
    this.setForm = new FormGroup({
      hours:   new FormControl('', [Validators.required]),
      minutes: new FormControl('', [Validators.required]),
      seconds: new FormControl('', [Validators.required]),
    });
    this.getTimer();
  }

  ngOnDestroy(): void {
    if (this.countdown != null) {
      clearInterval(this.countdown);
    }
  }
  
  // Set timer form setup.
  hasError = (controlName: string, errorName: string) => {
    return this.setForm.controls[controlName].hasError(errorName);
  }

  onSubmit(setFormInstance) {
    this.setTimer(0, setFormInstance.hours, setFormInstance.minutes, setFormInstance.seconds);
    this.formGroupDirective.resetForm();
  }

  updateClock(component: ControllerComponent) {

    // Compute timer countdown using current date and end date.
    const total = Date.parse(component.enddate) - Date.parse(Date());

    if (total <= 0) {
      component.state = "UNDEFINED";
      return;
    }

    const sec = Math.floor((total / 1000) % 60);
    const min = Math.floor((total / (1000 * 60)) % 60);
    const hrs = Math.floor((total / (1000 * 60 * 60)) % 60);
    const dys = Math.floor((total / (1000 * 60 * 60 * 24)) % 60);

    component.clock.t = total;
    component.clock.d = dys;
    component.clock.h = hrs;
    component.clock.m = min;
    component.clock.s = sec;
  }

  // Event emitters.
  getTimer() {
    this.socket.emit('get', this.event);
  }

  setTimer(days: number, hours: number, minutes: number, seconds: number) {
    this.socket.emit('set', {
        eventName: this.event,
        duration: { 
          d: days,
          h: hours,
          m: minutes,
          s: seconds,
        },
      });
  }

  startTimer() {
    this.socket.emit('start', this.event);
  }

  pauseTimer() {
    this.socket.emit('pause', this.event);
  }

  stopTimer() {
    this.socket.emit('stop', this.event);
  }

  // Button disabler methods.
  isStartBtnDisabled() {
    if (this.state == "UNDEFINED" || this.state == "ACTIVE") {
      return true;
    }

    return false;
  }

  isPauseBtnDisabled() {
    if (this.state != "ACTIVE") {
      return true;
    }

    return false;
  }

  isStopBtnDisabled() {
    if (this.state == "INACTIVE" || this.state == "UNDEFINED") {
      return true;
    }

    return false;
  }
}
