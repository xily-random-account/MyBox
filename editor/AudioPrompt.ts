import {Prompt} from "./Prompt.js";
import {SongDocument} from "./SongDocument.js";
import {ChangeSong} from "./changes.js";
import {HTML} from "imperative-html/dist/esm/elements-strict.js";

const {a, button, div, h2, input, p} = HTML;

export class AudioPrompt implements Prompt {
	private readonly _fileInput: HTMLInputElement = input({type: "file", accept: "audio/*,.mp3,.wav,.ogg,.m4a"});
	private readonly _recordButton: HTMLButtonElement = button({type: "button"}, "Record Microphone");
	private readonly _stopButton: HTMLButtonElement = button({type: "button", disabled: true}, "Stop Recording");
	private readonly _audio: HTMLAudioElement = document.createElement("audio");
	private readonly _status: HTMLDivElement = div({style: "min-height: 1.4em; color: var(--secondary-text);"});
	private readonly _download: HTMLAnchorElement = a({style: "display: none;"}, "Download Recording");
	private _mediaRecorder: MediaRecorder | null = null;
	private _stream: MediaStream | null = null;
	private _objectUrl: string | null = null;
	private _chunks: Blob[] = [];

	public readonly container: HTMLDivElement = div({class: "prompt noSelection", style: "width: 350px;"},
		h2("Audio Reference"),
		p("Load an MP3 or WAV, or record a microphone take for reference while you build the synth song. Audio references stay in this browser and are not embedded in the share URL."),
		this._fileInput,
		div({style: "display: flex; gap: 6px; margin: 10px 0;"}, this._recordButton, this._stopButton),
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
		const file: File | undefined = this._fileInput.files?.[0];
		if (file == undefined) return;
		this._setAudio(file, file.name);
	}

	private _setAudio(blob: Blob, name: string): void {
		if (this._objectUrl != null) URL.revokeObjectURL(this._objectUrl);
		this._objectUrl = URL.createObjectURL(blob);
		this._audio.src = this._objectUrl;
		this._audio.load();
		this._status.textContent = name + " ready for reference playback.";
		const reader = new FileReader();
		reader.addEventListener("load", () => {
			const songObject: any = this._doc.song.toJsonObject();
			songObject.audioTrack = {name, mimeType: blob.type || "audio/wav", dataUrl: reader.result, startBeat: 0, gain: 1};
			this._doc.record(new ChangeSong(this._doc, JSON.stringify(songObject)));
		});
		reader.readAsDataURL(blob);
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
		this._setAudio(recording, "Microphone recording");
		this._download.href = this._objectUrl!;
		this._download.download = "MyBox-recording.webm";
		this._download.style.display = "inline-block";
		this._status.textContent = "Recording ready for reference playback.";
	}
}