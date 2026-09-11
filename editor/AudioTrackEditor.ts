import {ColorConfig} from "./ColorConfig.js";
import {SongDocument} from "./SongDocument.js";
import {HTML} from "imperative-html/dist/esm/elements-strict.js";

const {button, div, span} = HTML;

export class AudioTrackEditor {
	private readonly _laneList: HTMLDivElement = div({style: "display: flex; flex-direction: column; gap: 3px;"});
	public readonly container: HTMLDivElement = div({class: "audioTrackEditor", style: "position: relative; overflow: hidden; padding: 4px 0 8px;"}, this._laneList);
	private _barWidth: number = 32;
	private _renderedWidth: number = -1;

	constructor(private readonly _doc: SongDocument, private readonly _addTrack: () => void) {}

	public render(): void {
		this._barWidth = this._doc.getBarWidth();
		const width: number = this._barWidth * this._doc.song.barCount;
		if (width != this._renderedWidth) {
			this._renderedWidth = width;
			this.container.style.width = width + "px";
		}
		this._laneList.textContent = "";
		const tracks: any[] = this._doc.song.audioTracks;
		for (const track of tracks) {
			const lane: HTMLDivElement = div({style: `position: relative; height: 34px; width: ${width}px; background: repeating-linear-gradient(90deg, transparent 0, transparent ${this._barWidth - 1}px, ${ColorConfig.uiWidgetBackground} ${this._barWidth - 1}px, ${ColorConfig.uiWidgetBackground} ${this._barWidth}px); border-top: 1px solid ${ColorConfig.uiWidgetBackground}; border-bottom: 1px solid ${ColorConfig.uiWidgetBackground};`});
			const startBeat: number = Number(track.startBeat) || 0;
			const startBar: number = startBeat / this._doc.song.beatsPerBar;
			const clip: HTMLDivElement = div({style: `position: absolute; left: ${startBar * this._barWidth}px; top: 3px; height: 26px; min-width: ${Math.max(this._barWidth * 2, 80)}px; max-width: calc(100% - ${startBar * this._barWidth}px); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; box-sizing: border-box; padding: 5px 8px; color: ${ColorConfig.primaryText}; background: ${ColorConfig.linkAccent}; opacity: ${track.muted ? 0.45 : 0.9}; border-radius: 3px;`}, span(track.name));
			lane.appendChild(clip);
			this._laneList.appendChild(lane);
		}
		const addButton: HTMLButtonElement = button({type: "button", style: "margin-top: 4px;"}, tracks.length == 0 ? "Add Audio Track" : "+ Add Audio Track");
		addButton.addEventListener("click", this._addTrack);
		this._laneList.appendChild(addButton);
	}
}
