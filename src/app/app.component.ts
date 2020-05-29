import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { BehaviorSubject } from 'rxjs';
import { MpdService, state_t } from './mpd.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private volumeIncrement: number;
  private voluming: boolean;
  
  readonly state: BehaviorSubject<state_t>;
  readonly volume: BehaviorSubject<number>;

  // _volume?: number;
  // title = 'moode-front';

  // get volume(): number {
  //   return this._volume != undefined ? this._volume : this.mpdService.volume;
  // }
  // set volume(value: number) {
  //   this.mpdService.volume = value;
  // }

  constructor(private mpdService: MpdService) {
    this.volumeIncrement = 10;
    this.voluming = false;
    
    this.state = this.mpdService.state;
    this.volume = new BehaviorSubject(0);
  
    mpdService.volume.asObservable().subscribe(value => 
    {
      // console.log(`volume received: ${value}`);
      if (!this.voluming)
        this.volume.next(value);
    });
  }

  async decVol(): Promise<void> {
    const vol = Math.max(0, this.volume.value - this.volumeIncrement);
    this.mpdService.setvol(vol);
  }

  async incVol(): Promise<void> {
    const vol = Math.min(100, this.volume.value + this.volumeIncrement);
    this.mpdService.setvol(vol);
  }

  async next(): Promise<void> {
    this.mpdService.next();
  }

  async onVolumeChange(ev: MatSliderChange): Promise<void> {
    if (ev.value == null)
      return;

    this.voluming = false;
    this.mpdService.setvol(ev.value);
  }

  async onVolumeInput(ev: MatSliderChange): Promise<void> {
    if (ev.value == null)
      return;

    this.voluming = true;
    this.mpdService.setvol(ev.value);
    // we update the local volume value
    this.volume.next(ev.value);
  }

  async pause(value: number): Promise<void> {
    this.mpdService.pause(value);
  }

  async previous(): Promise<void> {
    this.mpdService.previous();
  }
}
