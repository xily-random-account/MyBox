import {ColorConfig} from "./ColorConfig.js";
import {SongDocument} from "./SongDocument.js";
import {ChangeSong} from "./changes.js";
import {HTML} from "imperative-html/dist/esm/elements-strict.js";

const {button, div, span} = HTML;

export class AudioTrackEditor {
    private readonly _laneList: HTMLDivElement = div({style: "display: flex; flex-direction: column; gap: 3px;"});
    public readonly container: HTMLDivElement = div({class: "audioTrackEditor", style: "position: relative; overflow: hidden; padding: 4px 0 8px;"}, this._laneList);
    private _barWidth: number = 32;
    private _renderedWidth: number = -1;

    // Simple per-track audio players for preview/playback.
    private readonly _audioPlayers: Map<number, HTMLAudioElement> = new Map();

    constructor(private readonly _doc: SongDocument, private readonly _addTrack: () => void) {
        this.container.addEventListener("dragover", this._whenDragOver);
        this.container.addEventListener("dragleave", () => this.container.classList.remove("audioDropTarget"));
        this.container.addEventListener("drop", this._whenDrop);
    }

    private _whenDragOver = (event: DragEvent): void => {
        if (event.dataTransfer?.types.includes("Files")) {
            event.preventDefault();
            this.container.classList.add("audioDropTarget");
        }
    }

    private _whenDrop = (event: DragEvent): void => {
        event.preventDefault();
        this.container.classList.remove("audioDropTarget");
        const files: File[] = Array.from(event.dataTransfer?.files || []).filter(file => file.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/i.test(file.name));
        this._addFiles(files);
    }

    private _addFiles(files: File[]): void {
        for (const file of files) {
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                const songObject: any = this._doc.song.toJsonObject();
                const audioTracks: any[] = Array.isArray(songObject.audioTracks) ? songObject.audioTracks : [];
                audioTracks.push({
                    name: file.name,
                    mimeType: file.type || "audio/wav",
                    dataUrl: reader.result,
                    startBeat: 0,
                    gain: 1,
                    pan: 0,
                    fadeIn: 0,
                    fadeOut: 0,
                    muted: false,
                    lowpass: 0,
                    highpass: 0
                });
                songObject.audioTracks = audioTracks;
                delete songObject.audioTrack;
                this._doc.record(new ChangeSong(this._doc, JSON.stringify(songObject)));
            });
            // Use Data URL so it can be stored in JSON and directly fed to <audio>.
            reader.readAsDataURL(file);
        }
    }

    private _moveTrack(index: number, startBeat: number): void {
        const songObject: any = this._doc.song.toJsonObject();
        const audioTracks: any[] = Array.isArray(songObject.audioTracks) ? songObject.audioTracks : [];
        if (audioTracks[index] == undefined) return;
        audioTracks[index].startBeat = Math.max(0, Math.min(this._doc.song.barCount * this._doc.song.beatsPerBar, Math.round(startBeat * 4) / 4));
        songObject.audioTracks = audioTracks;
        delete songObject.audioTrack;
        this._doc.record(new ChangeSong(this._doc, JSON.stringify(songObject)));
    }

    public render(): void {
        this._barWidth = this._doc.getBarWidth();
        const width: number = this._barWidth * this._doc.song.barCount;
        if (width != this._renderedWidth) {
            this._renderedWidth = width;
            this.container.style.width = width + "px";
        }
        this._laneList.textContent = "";
        this._audioPlayers.clear();

        const tracks: any[] = this._doc.song.audioTracks;
        for (const track of tracks) {
            const lane: HTMLDivElement = div({
                style: `position: relative; height: 34px; width: ${width}px; background: repeating-linear-gradient(90deg, transparent 0, transparent ${this._barWidth - 1}px, ${ColorConfig.uiWidgetBackground} ${this._barWidth - 1}px, ${ColorConfig.uiWidgetBackground} ${this._barWidth}px); border-top: 1px solid ${ColorConfig.uiWidgetBackground}; border-bottom: 1px solid ${ColorConfig.uiWidgetBackground};`
            });
            const trackIndex: number = tracks.indexOf(track);
            const startBeat: number = Number(track.startBeat) || 0;
            const startBar: number = startBeat / this._doc.song.beatsPerBar;
            const clipWidth: number = Math.max(this._barWidth * 2, Math.min(width - startBar * this._barWidth, this._barWidth * 8));

            const clip: HTMLDivElement = div({
                class: "audioClip",
                draggable: "false",
                style: `position: absolute; left: ${startBar * this._barWidth}px; top: 3px; height: 26px; width: ${clipWidth}px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; box-sizing: border-box; padding: 5px 8px; color: ${ColorConfig.primaryText}; background: linear-gradient(180deg, color-mix(in srgb, ${ColorConfig.linkAccent} 92%, white), ${ColorConfig.linkAccent}); opacity: ${track.muted ? 0.45 : 0.9}; border-radius: 3px; cursor: grab; user-select: none;`
            }, span(track.name));

            const waveform: HTMLDivElement = div({
                style: `position: absolute; inset: 0; opacity: 0.28; pointer-events: none; background: repeating-linear-gradient(90deg, transparent 0, transparent 3px, ${ColorConfig.primaryText} 3px, ${ColorConfig.primaryText} 5px, transparent 5px, transparent 9px);`
            });
            clip.insertBefore(waveform, clip.firstChild);

            // Create an audio element for this track using the stored dataUrl.
            if (typeof track.dataUrl === "string") {
                const audio = new Audio(track.dataUrl);
                audio.preload = "auto";
                audio.volume = track.gain ?? 1;
                this._audioPlayers.set(trackIndex, audio);

                // Simple click-to-play / click-to-stop behavior for now.
                clip.addEventListener("click", (event: MouseEvent) => {
                    event.stopPropagation();
                    const current = this._audioPlayers.get(trackIndex);
                    if (!current) return;
                    if (current.paused) {
                        // Start from the beginning for now; later you can sync to the song's playhead.
                        current.currentTime = 0;
                        current.play().catch(err => {
                            console.error("Failed to play audio track:", err);
                        });
                    } else {
                        current.pause();
                    }
                });
            }

            this._addClipDrag(clip, trackIndex, startBeat, width, clipWidth);
            lane.appendChild(clip);
            this._laneList.appendChild(lane);
        }

        const addButton: HTMLButtonElement = button({type: "button", style: "margin-top: 4px;"}, tracks.length == 0 ? "Add Audio Track" : "+ Add Audio Track");
        addButton.addEventListener("click", this._addTrack);
        this._laneList.appendChild(addButton);
    }

    private _addClipDrag(clip: HTMLDivElement, index: number, startBeat: number, width: number, clipWidth: number): void {
        let startX: number = 0;
        let moved: boolean = false;
        const initialLeft: number = startBeat / this._doc.song.beatsPerBar * this._barWidth;
        clip.addEventListener("pointerdown", (event: PointerEvent) => {
            startX = event.clientX;
            moved = false;
            clip.setPointerCapture(event.pointerId);
            clip.style.cursor = "grabbing";
        });
        clip.addEventListener("pointermove", (event: PointerEvent) => {
            if (!clip.hasPointerCapture(event.pointerId)) return;
            const left = Math.max(0, Math.min(width - clipWidth, initialLeft + event.clientX - startX));
            moved = moved || Math.abs(event.clientX - startX) > 3;
            clip.style.left = left + "px";
        });
        clip.addEventListener("pointerup", (event: PointerEvent) => {
            if (!clip.hasPointerCapture(event.pointerId)) return;
            clip.releasePointerCapture(event.pointerId);
            clip.style.cursor = "grab";
            if (moved) this._moveTrack(index, Math.max(0, (initialLeft + event.clientX - startX) / this._barWidth * this._doc.song.beatsPerBar));
        });
    }
}
