import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSpinner } from '@angular/material/progress-spinner';
import { MatSliderChange } from '@angular/material/slider';
import { BehaviorSubject } from 'rxjs';
import { MpdService, state_t } from './mpd.service';

function assertUnreachable(x: never): never {
  throw new Error(`Unexpected value: "${x}".`);
}

@Component({
  selector:        'app-root',
  templateUrl:     './app.component.html',
  styleUrls:       ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private overlayRef:          OverlayRef;
  private volumeIncrement:     number;
  private userIsSettingVolume: boolean;

  readonly playPauseIcon: BehaviorSubject<string>;
  readonly state:         BehaviorSubject<state_t>;
  readonly volume:        BehaviorSubject<number>;

  constructor(
    private mpdService: MpdService,
    private overlay:    Overlay,
  ) {
    this.volumeIncrement     = 10;
    this.userIsSettingVolume = false;

    this.playPauseIcon = new BehaviorSubject('');
    this.state         = this.mpdService.state;
    this.volume        = new BehaviorSubject(0);

    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: ['cdk-overlay-dark-backdrop', 'backdrop-blur'],
      positionStrategy: this.overlay.position().global()
        .centerHorizontally()
        .centerVertically(),
    });

    // We subscribe to the observables provided by the mpd service.
    this.mpdService.connected.subscribe(value => this.onMpdConnectedChange(value));
    this.mpdService.state.subscribe(value => this.onMpdStateChange(value));
    this.mpdService.volume.subscribe(value => this.onMpdVolumeChange(value));
  }

  private onMpdConnectedChange(value?: boolean): void {
    // If the value is undefined (which is the initial value, before a
    // connection has been even started), we do nothing.
    if (value == undefined)
      return;

    // If connection fails and we don not have an overlay, we create one.
    if (!value && !this.overlayRef.hasAttached())
      this.overlayRef.attach(new ComponentPortal(MatSpinner));

    // If a connection succeds and there is an overlay, we remove it.
    if (value && this.overlayRef.hasAttached())
      this.overlayRef.detach();
  }

  private onMpdStateChange(value: state_t): void {
    this.playPauseIcon.next(value == 'play' ? 'pause' : 'play_arrow');
  }

  private onMpdVolumeChange(value: number): void {
    // while the user is actively setting the volume via the slider,
    // we ignore any volume change reported by mpd to prevent flickering.
    if (this.userIsSettingVolume)
      return;

    this.volume.next(value);
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

    // on change event, we have ended actively setting the volume
    this.userIsSettingVolume = false;
    this.mpdService.setvol(ev.value);
  }

  async onVolumeInput(ev: MatSliderChange): Promise<void> {
    if (ev.value == null)
      return;

    // an input event means we are actively setting the volume.
    this.userIsSettingVolume = true;
    this.mpdService.setvol(ev.value);

    // we update the local volume value to show correctly in the UI the
    // instant volume value from user interaction.
    this.volume.next(ev.value);
  }

  async playPause(): Promise<void> {
    switch (this.state.value) {
      case 'pause':
        this.mpdService.pause(0);
        break;

      case 'play':
        this.mpdService.pause(1);
        break;

      case 'stop':
        // TODO:
        this.mpdService.pause(0);
        break;

      default:
        assertUnreachable(this.state.value);
    }
  }

  // async pause(value: number): Promise<void> {
  //   this.mpdService.pause(value);
  // }

  async previous(): Promise<void> {
    this.mpdService.previous();
  }
}
