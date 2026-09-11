import {Prompt} from "./Prompt.js";
import {SongDocument} from "./SongDocument.js";
import {ChangeSong} from "./changes.js";
import {HTML} from "imperative-html/dist/esm/elements-strict.js";

const {a, button, div, h2, input, p} = HTML;

export class AudioPrompt implements Prompt {
	private readonly _fileInput: HTMLInputElement = input({type: "file", multiple: true, accept: "audio/*,.mp3,.wav,.ogg,.m4a"});
	private readonly _recordButton: HTMLButtonElement = button({type: "button"}, "Record Microphone");
	private readonly _stopButton: HTMLButtonElement = button({type: "button", disabled: true}, "Stop Recording");
	private readonly _audio: HTMLAudioElement = document.createElement("audio");
	private readonly _trackList: HTMLDivElement = div({style: "text-align: left; margin: 10px 0;"});
	private readonly _status: HTMLDivElement = div({style: "min-height: 1.4em; color: var(--secondary-text);"});
	private readonly _download: HTMLAnchorElement = a({style: "display: none;"}, "Download Recording");
	private _mediaRecorder: MediaRecorder | null = null;
	private _stream: MediaStream | null = null;
	private _objectUrl: string | null = null;
	private _chunks: Blob[] = [];

	public readonly container: HTMLDivElement = div({class: "prompt noSelection", style: "width: 430px;"},
		h2("Audio Tracks"),
		p("Add multiple audio files and mix them with the synth song. Each track can start at a different beat and has independent level, mute, fade, and filter controls."),
		this._fileInput,
		div({style: "display: flex; gap: 6px; margin: 10px 0;"}, this._recordButton, this._stopButton),
		this._trackList,
		this._audio,
		this._status,
		this._download,
		button({type: "button", class: "cancelButton"}, "Close"),
	);

	constructor(private readonly _doc: SongDocument) {
		this._fileInput.addEventListener("change", this._whenFileSelected);
		this._recordButton.addEventListener("click", this._startRecording);
		this._stopButton.addEventListener("click", this._stopRecording);
		this.container.querySelector(".cancelButton")!.addEventListener("click", this._close);
		this._audio.controls = true;
		this._audio.style.width = "100%";
		this._audio.style.marginTop = "8px";
		this._renderTrackList();
	}

	public cleanUp = (): void => {
		this._fileInput.removeEventListener("change", this._whenFileSelected);
		this._recordButton.removeEventListener("click", this._startRecording);
		this._stopButton.removeEventListener("click", this._stopRecording);
		this._stopRecording();
		if (this._objectUrl != null) URL.revokeObjectURL(this._objectUrl);
	}

	private _close = (): void => {
		this._stopRecording();
		this._doc.prompt = null;
		this._doc.renderNow();
	}

	private _whenFileSelected = (): void => {
		const files: File[] = Array.from(this._fileInput.files || []);
		for (const file of files) this._readAudio(file, file.name);
		this._fileInput.value = "";
	}

	private _readAudio(blob: Blob, name: string): void {
		const reader = new FileReader();
		reader.addEventListener("load", () => {
			const songObject: any = this._doc.song.toJsonObject();
			const audioTracks: any[] = Array.isArray(songObject.audioTracks) ? songObject.audioTracks : [];
			audioTracks.push({name, mimeType: blob.type || "audio/wav", dataUrl: reader.result, startBeat: 0, gain: 1, pan: 0, fadeIn: 0, fadeOut: 0, muted: false, lowpass: 0, highpass: 0});
			songObject.audioTracks = audioTracks;
			delete songObject.audioTrack;
			this._doc.record(new ChangeSong(this._doc, JSON.stringify(songObject)));
			this._setPreview(blob, name);
			this._renderTrackList();
		});
		reader.readAsDataURL(blob);
	}

	private _setPreview(blob: Blob, name: string): void {
		if (this._objectUrl != null) URL.revokeObjectURL(this._objectUrl);
		this._objectUrl = URL.createObjectURL(blob);
		this._audio.src = this._objectUrl;
		this._audio.load();
		this._status.textContent = name + " ready for preview.";
	}

	private _updateTrack(index: number, values: any): void {
		const songObject: any = this._doc.song.toJsonObject();
		const audioTracks: any[] = Array.isArray(songObject.audioTracks) ? songObject.audioTracks : [];
		if (audioTracks[index] == undefined) return;
		Object.assign(audioTracks[index], values);
		songObject.audioTracks = audioTracks;
		delete songObject.audioTrack;
		this._doc.record(new ChangeSong(this._doc, JSON.stringify(songObject)));
		this._renderTrackList();
	}

	private _removeTrack(index: number): void {
		const songObject: any = this._doc.song.toJsonObject();
		const audioTracks: any[] = Array.isArray(songObject.audioTracks) ? songObject.audioTracks : [];
		audioTracks.splice(index, 1);
		songObject.audioTracks = audioTracks;
		delete songObject.audioTrack;
		this._doc.record(new ChangeSong(this._doc, JSON.stringify(songObject)));
		this._renderTrackList();
	}

	private _renderTrackList(): void {
		this._trackList.textContent = "";
		const tracks: any[] = this._doc.song.audioTracks;
		if (tracks.length == 0) {
			this._trackList.textContent = "No audio tracks added yet.";
			return;
		}
		tracks.forEach((track, index) => {
			const row: HTMLDivElement = div({style: "border: 1px solid var(--secondary-text); padding: 6px; margin: 5px 0;"});
			const title = document.createElement("strong");
			title.textContent = track.name;
			const removeButton = button({type: "button", style: "float: right;"}, "Remove");
			removeButton.addEventListener("click", () => this._removeTrack(index));
			row.append(title, removeButton);
			const controls = document.createElement("div");
			controls.style.cssText = "display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 4px 8px; align-items: center; margin-top: 6px;";
			this._addNumberControl(controls, "Start beat", track.startBeat, 0, 0.25, value => this._updateTrack(index, {startBeat: value}));
			this._addNumberControl(controls, "Gain", track.gain, 0, 0.05, value => this._updateTrack(index, {gain: value}));
			this._addNumberControl(controls, "Pan", track.pan, -1, 0.05, value => this._updateTrack(index, {pan: Math.max(-1, Math.min(1, value))}));
			this._addNumberControl(controls, "Fade in", track.fadeIn, 0, 0.25, value => this._updateTrack(index, {fadeIn: value}));
			this._addNumberControl(controls, "Fade out", track.fadeOut, 0, 0.25, value => this._updateTrack(index, {fadeOut: value}));
			this._addNumberControl(controls, "Low pass Hz", track.lowpass, 0, 100, value => this._updateTrack(index, {lowpass: value}));
			this._addNumberControl(controls, "High pass Hz", track.highpass, 0, 100, value => this._updateTrack(index, {highpass: value}));
			const mute = input({type: "checkbox"});
			mute.checked = track.muted === true;
			mute.addEventListener("change", () => this._updateTrack(index, {muted: mute.checked}));
			controls.append("Mute", mute);
			row.appendChild(controls);
			this._trackList.appendChild(row);
		});
	}

	private _addNumberControl(container: HTMLDivElement, label: string, value: number, min: number, step: number, change: (value: number) => void): void {
		const numberInput = input({type: "number", min: String(min), step: String(step), value: String(value), style: "width: 5em;"});
		numberInput.addEventListener("change", () => change(Math.max(min, Number(numberInput.value) || 0)));
		container.append(label, numberInput);
	}

	private _startRecording = async (): Promise<void> => {
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder == "undefined") {
			this._status.textContent = "Microphone recording is not supported in this browser.";
			return;
		}
		try {
			this._stream = await navigator.mediaDevices.getUserMedia({audio: true});
			this._chunks = [];
			this._mediaRecorder = new MediaRecorder(this._stream);
			this._mediaRecorder.addEventListener("dataavailable", event => this._chunks.push(event.data));
			this._mediaRecorder.addEventListener("stop", this._recordingStopped);
			this._mediaRecorder.start();
			this._recordButton.disabled = true;
			this._stopButton.disabled = false;
			this._status.textContent = "Recording microphone...";
		} catch (error) {
			this._status.textContent = "Microphone permission was not granted.";
		}
	}

	private _stopRecording = (): void => {
		if (this._mediaRecorder != null && this._mediaRecorder.state != "inactive") this._mediaRecorder.stop();
		if (this._stream != null) this._stream.getTracks().forEach(track => track.stop());
		this._stream = null;
		this._mediaRecorder = null;
		this._recordButton.disabled = false;
		this._stopButton.disabled = true;
	}

	private _recordingStopped = (): void => {
		const recording = new Blob(this._chunks, {type: this._chunks[0]?.type || "audio/webm"});
		this._readAudio(recording, "Microphone recording");
		this._setPreview(recording, "Microphone recording");
		this._download.href = this._objectUrl!;
		this._download.download = "MyBox-recording.webm";
		this._download.style.display = "inline-block";
		this._status.textContent = "Recording ready for preview.";
	}
}
