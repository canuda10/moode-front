import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

export type state_t = 'play' | 'stop' | 'pause';

interface MpdMessage {
  cmd: 'next' | 'pause' | 'previous' | 'volume';
  pause: number;
  state: state_t;
  volume: number;
}

@Injectable({
  providedIn: 'root'
})
export class MpdService {
  private socket: WebSocketSubject<Partial<MpdMessage>>

  readonly state: BehaviorSubject<state_t>;
  readonly volume: BehaviorSubject<number>

  constructor() { 
    this.state = new BehaviorSubject<state_t>('stop');
    this.volume = new BehaviorSubject(0);

    this.socket = webSocket({
      url: 'ws://raspi1.local:3000',
      openObserver: {
        next: ev => console.log(ev)
      },
      closeObserver: {
        next: ev => console.log(ev)
      }
    });

    this.socket.asObservable().subscribe(
      msg => this.onResponse(msg),
      err => this.onError(err),
    );
  }

  private onError(err: unknown): void {
    console.log(err);
  }

  private onResponse(msg: Partial<MpdMessage>): void {
    if (msg.state != undefined && msg.state != this.state.value) {
      this.state.next(msg.state);
    }


    if (msg.volume != undefined && msg.volume != this.volume.value)
      this.volume.next(msg.volume);
  }

  async next(): Promise<void> {
    this.socket.next({ cmd: 'next'});
  }

  async pause(value: number): Promise<void> {
    this.socket.next({ pause: value });
  }

  async previous(): Promise<void> {
    this.socket.next({ cmd: 'previous'});
  }

  async setvol(value: number): Promise<void> {
    if (value != this.volume.value)
      this.socket.next({ volume: value });
  }
}
