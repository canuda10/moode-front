import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

interface MpdMessage {
  volume: number;
}

@Injectable({
  providedIn: 'root'
})
export class MpdService {
  private socket: WebSocketSubject<Partial<MpdMessage>>

  readonly volume = new BehaviorSubject(0);

  constructor() { 
    this.socket = webSocket({
      url: 'ws://localhost:3000',
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
    if (msg.volume != undefined && msg.volume != this.volume.value)
      this.volume.next(msg.volume);
  }

  async setvol(value: number): Promise<void> {
    if (value != this.volume.value)
      this.socket.next({ volume: value });
  }
}
