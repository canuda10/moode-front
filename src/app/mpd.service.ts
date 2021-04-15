import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { delay, retryWhen, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

export type cmd_t   = 'next' | 'pause' | 'previous' | 'setvol';
export type data_t  = { [key: string]: string };
export type state_t = 'play' | 'stop' | 'pause';

interface MpdMessage {
  cmd:         cmd_t;
  currentsong: data_t;
  pause:       number;
  state:       state_t;
  volume:      number;
}

const RECONNECT_INTERVAL = 2000;

@Injectable({
  providedIn: 'root'
})
export class MpdService {
  private socket: WebSocketSubject<Partial<MpdMessage>>

  readonly connected:   BehaviorSubject<undefined | boolean>;
  readonly currentsong: BehaviorSubject<data_t>;
  readonly state:       BehaviorSubject<state_t>;
  readonly volume:      BehaviorSubject<number>;

  constructor() {
    this.connected   = new BehaviorSubject<undefined | boolean>(undefined);
    this.currentsong = new BehaviorSubject({});
    this.state       = new BehaviorSubject<state_t>('stop');
    this.volume      = new BehaviorSubject(0);

    this.socket = webSocket({
      url: 'ws://raspi1.local:3000',
      // url: 'ws://localhost:3000',
      openObserver: { next: ev => {
        console.log(`Connection open: "${ev}".`);
        this.connected.next(true);
      } },
      closeObserver: { next: ev => {
        console.log(`Connection closed: "${ev}".`);
        this.connected.next(false);
      } },
    });

    this.socket
    .pipe(
      // tap(msg => {}),
      retryWhen(errors =>
        errors.pipe(
          tap(err => console.error('Got Error', err)),
          delay(RECONNECT_INTERVAL)
        )
      )
    )
    .subscribe(
      msg => this.onResponse(msg),
      err => this.onError(err),
    );
  }

  private onError(err: unknown): void {
    console.log(err);
  }

  private onResponse(msg: Partial<MpdMessage>): void {
    if (msg.state != undefined && msg.state != this.state.value)
      this.state.next(msg.state);

    if (msg.volume != undefined && msg.volume != this.volume.value)
      this.volume.next(msg.volume);

    if (msg.currentsong != undefined) {
      const data = {
        ...this.currentsong.value,
        ...msg.currentsong,
      }
      this.currentsong.next(data);
    }
  }

  async next(): Promise<void> {
    this.socket.next({ cmd: 'next'});
  }

  async pause(value: number): Promise<void> {
    this.socket.next({ cmd: 'pause', pause: value });
  }

  async previous(): Promise<void> {
    this.socket.next({ cmd: 'previous'});
  }

  async setvol(value: number): Promise<void> {
    if (value != this.volume.value)
      this.socket.next({ cmd: 'setvol', volume: value });
  }
}
