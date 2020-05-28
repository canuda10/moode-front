import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { BehaviorSubject } from 'rxjs';
import { MpdService } from './mpd.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private voluming = false;

  // _volume?: number;
  title = 'moode-front';

  readonly volume = new BehaviorSubject(0);
  // get volume(): number {
  //   return this._volume != undefined ? this._volume : this.mpdService.volume;
  // }
  // set volume(value: number) {
  //   this.mpdService.volume = value;
  // }

  constructor(private mpdService: MpdService) {
    mpdService.volume.asObservable().subscribe(value => 
    {
      // console.log(`volume received: ${value}`);
      if (!this.voluming)
        this.volume.next(value);
    });
  }

  onVolumeChange(ev: MatSliderChange): void {
    this.voluming = false;
    this.mpdService.setvol(ev.value);
    // this.volume = ev.value;
    // delete this._volume;
  }

  onVolumeInput(ev: MatSliderChange): void {
    this.voluming = true;
    this.mpdService.setvol(ev.value);
    // this.volume = ev.value;
    // this._volume = ev.value;
  }
}
