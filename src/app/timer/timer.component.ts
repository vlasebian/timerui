import { Component, OnInit } from '@angular/core';

import { Socket } from 'ngx-socket-io';
import { Timer } from '../model/timer';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss']
})
export class TimerComponent implements OnInit {
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

  constructor(
    private socket: Socket,
  ) { }

  ngOnInit(): void {
    this.getTimer();
  }

  updateClock(component) {

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
}
