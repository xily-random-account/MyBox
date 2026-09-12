// Copyright (c) John Nesky and contributing authors, distributed under the MIT license, see accompanying the LICENSE.md file.

import {Dictionary, DictionaryArray, EnvelopeType, InstrumentType, Transition, Chord, Envelope, Config} from "../synth/SynthConfig.js";
import {ColorConfig} from "../editor/ColorConfig.js";
import {NotePin, Note, Pattern, Instrument, Channel, Synth} from "../synth/synth.js";
import {HTML, SVG} from "imperative-html/dist/esm/elements-strict.js";

const {a, button, div, h1, input, span} = HTML;
const {svg, circle, rect, path} = SVG;

document.head.appendChild(HTML.style({type: "text/css"}, `
	body {
		color: ${ColorConfig.primaryText};
		background: ${ColorConfig.editorBackground};
	}
	.playerVisualization {
		background: ${ColorConfig.editorBackground};
		border: 1px solid ${ColorConfig.uiWidgetFocus};
		border-radius: 10px;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24);
	}
	.playerHeader {
		box-sizing: border-box;
		width: min(1180px, calc(100vw - 28px));
		margin: 14px auto 10px;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 16px;
		border: 1px solid ${ColorConfig.uiWidgetFocus};
		border-radius: 10px;
		background: ${ColorConfig.editorBackground};
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
	}
	.playerStartup {
		position: fixed;
		inset: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
		background: ${ColorConfig.editorBackground};
		color: ${ColorConfig.primaryText};
		font-size: 18px;
		font-weight: bold;
	}
	.playerHeader h1 {
		font-size: 17px;
		letter-spacing: 0.02em;
	}
	.playerMeta {
		color: ${ColorConfig.secondaryText};
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.playerLinks {
		display: flex;
		gap: 10px;
		margin-left: auto;
	}
	.audioTimeline {
		box-sizing: border-box;
		width: min(1180px, calc(100vw - 28px));
		margin: 10px auto;
		padding: 10px 12px 12px;
		border: 1px solid ${ColorConfig.uiWidgetFocus};
		border-radius: 10px;
		background: ${ColorConfig.editorBackground};
		overflow: hidden;
	}
	.audioTimelineHeader {
		color: ${ColorConfig.secondaryText};
		font-size: 11px;
		font-weight: bold;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		margin-bottom: 8px;
	}
	.audioTimelineViewport {
		overflow: hidden;
		position: relative;
	}
	.audioTimelineList {
		position: relative;
		transition: transform 80ms linear;
	}
	.audioTimelineLane {
		position: relative;
		height: 38px;
		margin: 4px 0;
		border-top: 1px solid ${ColorConfig.uiWidgetBackground};
		border-bottom: 1px solid ${ColorConfig.uiWidgetBackground};
		background: repeating-linear-gradient(90deg, transparent 0, transparent 63px, ${ColorConfig.uiWidgetBackground} 63px, ${ColorConfig.uiWidgetBackground} 64px);
	}
	.audioTimelineClip {
		position: absolute;
		top: 4px;
		height: 30px;
		box-sizing: border-box;
		padding: 7px 10px;
		border-radius: 5px;
		background: ${ColorConfig.linkAccent};
		color: ${ColorConfig.invertedText};
		font-size: 12px;
		font-weight: bold;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.audioAutomationCurve {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		opacity: 0.82;
	}
	.audioTimelineEmpty {
		color: ${ColorConfig.secondaryText};
		font-size: 12px;
		padding: 8px 0 2px;
	}
	.playerVisualizer {
		position: absolute;
		inset: auto 0 0;
		width: 100%;
		height: 72px;
		pointer-events: none;
		opacity: 0.72;
	}
	.playerTransport {
		box-sizing: border-box;
		width: min(1180px, calc(100vw - 28px));
		margin: 0 auto 14px;
		background: ${ColorConfig.editorBackground};
		border-top: 1px solid ${ColorConfig.uiWidgetFocus};
		border: 1px solid ${ColorConfig.uiWidgetFocus};
		border-radius: 10px;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
		gap: 8px;
		padding: 10px 12px;
	}
	h1 {
		font-weight: bold;
		font-size: 13px;
		line-height: 22px;
		text-align: initial;
		margin: 0;
	}
	a {
		font-weight: bold;
		font-size: 12px;
		line-height: 22px;
		white-space: nowrap;
		color: ${ColorConfig.linkAccent};
	}
	button {
		margin: 0;
		padding: 0;
		position: relative;
		border: none;
		border-radius: 5px;
		background: ${ColorConfig.uiWidgetBackground};
		color: ${ColorConfig.primaryText};
		cursor: pointer;
		font-size: 14px;
		font-family: inherit;
		min-height: 28px;
	}
	button:hover, button:focus {
		background: ${ColorConfig.uiWidgetFocus};
	}
	.playButton, .pauseButton {
		background: ${ColorConfig.loopAccent};
		color: ${ColorConfig.invertedText};
		font-weight: bold;
		padding-left: 24px;
		padding-right: 6px;
	}
	.playButton::before {
		content: "";
		position: absolute;
		left: 6px;
		top: 50%;
		margin-top: -6px;
		width: 12px;
		height: 12px;
		pointer-events: none;
		background: ${ColorConfig.primaryText};
		-webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="-6 -6 12 12"><path d="M 6 0 L -5 6 L -5 -6 z" fill="gray"/></svg>');
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-position: center;
		mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="-6 -6 12 12"><path d="M 6 0 L -5 6 L -5 -6 z" fill="gray"/></svg>');
		mask-repeat: no-repeat;
		mask-position: center;
	}
	.pauseButton::before {
		content: "";
		position: absolute;
		left: 6px;
		top: 50%;
		margin-top: -6px;
		width: 12px;
		height: 12px;
		pointer-events: none;
		background: ${ColorConfig.primaryText};
		-webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="-6 -6 12 12"><rect x="-5" y="-6" width="3" height="12" fill="gray"/><rect x="2"  y="-6" width="3" height="12" fill="gray"/></svg>');
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-position: center;
		mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="-6 -6 12 12"><rect x="-5" y="-6" width="3" height="12" fill="gray"/><rect x="2"  y="-6" width="3" height="12" fill="gray"/></svg>');
		mask-repeat: no-repeat;
		mask-position: center;
	}
	
	input[type=range] {
		-webkit-appearance: none;
		appearance: none;
		height: 16px;
		margin: 0;
		cursor: pointer;
		background-color: ${ColorConfig.editorBackground};
		touch-action: pan-y;
	}
	input[type=range]:focus {
		outline: none;
	}
	input[type=range]::-webkit-slider-runnable-track {
		width: 100%;
		height: 4px;
		cursor: pointer;
		background: ${ColorConfig.uiWidgetBackground};
	}
	input[type=range]::-webkit-slider-thumb {
		height: 16px;
		width: 4px;
		border-radius: 2px;
		background: ${ColorConfig.primaryText};
		cursor: pointer;
		-webkit-appearance: none;
		margin-top: -6px;
	}
	input[type=range]:focus::-webkit-slider-runnable-track, input[type=range]:hover::-webkit-slider-runnable-track {
		background: ${ColorConfig.uiWidgetFocus};
	}
	input[type=range]::-moz-range-track {
		width: 100%;
		height: 4px;
		cursor: pointer;
		background: ${ColorConfig.uiWidgetBackground};
	}
	input[type=range]:focus::-moz-range-track, input[type=range]:hover::-moz-range-track  {
		background: ${ColorConfig.uiWidgetFocus};
	}
	input[type=range]::-moz-range-thumb {
		height: 16px;
		width: 4px;
		border-radius: 2px;
		border: none;
		background: ${ColorConfig.primaryText};
		cursor: pointer;
	}
	input[type=range]::-ms-track {
		width: 100%;
		height: 4px;
		cursor: pointer;
		background: ${ColorConfig.uiWidgetBackground};
		border-color: transparent;
	}
	input[type=range]:focus::-ms-track, input[type=range]:hover::-ms-track {
		background: ${ColorConfig.uiWidgetFocus};
	}
	input[type=range]::-ms-thumb {
		height: 16px;
		width: 4px;
		border-radius: 2px;
		background: ${ColorConfig.primaryText};
		cursor: pointer;
	}
`));

ColorConfig.setTheme("dark classic");

let prevHash: string | null = null;
let id: string = ((Math.random() * 0xffffffff) >>> 0).toString(16);
let pauseButtonDisplayed: boolean = false;
let animationRequest: number | null;
let zoomEnabled: boolean = false;
let timelineWidth: number = 1;

const synth: Synth = new Synth();
interface AudioTrackPlayback {
	element: HTMLAudioElement;
	gain: GainNode | null;
	pan: StereoPannerNode | null;
	lowpass: BiquadFilterNode | null;
	highpass: BiquadFilterNode | null;
}
const audioTracks: AudioTrackPlayback[] = [];
const audioContextConstructor: any = (<any>window).AudioContext || (<any>window).webkitAudioContext;
const audioContext: any = audioContextConstructor == undefined ? null : new audioContextConstructor();
const audioAnalyser: AnalyserNode | null = audioContext == null ? null : audioContext.createAnalyser();
if (audioAnalyser != null) {
	audioAnalyser.fftSize = 128;
	audioAnalyser.smoothingTimeConstant = 0.78;
	audioAnalyser.connect(audioContext.destination);
}
const isMobile: boolean = matchMedia("(pointer:coarse)").matches;
synth.anticipatePoorPerformance = isMobile;

let titleText: HTMLHeadingElement = h1({style: "flex-grow: 1; margin: 0 1px;"}, "");
let songMeta: HTMLSpanElement = span({class: "playerMeta"}, "Loading song");
let editLink: HTMLAnchorElement = a({target: "_top", style: "margin: 0 4px;"}, "✎ Edit");
let copyLink: HTMLAnchorElement = a({href: "javascript:void(0)", style: "margin: 0 4px;"}, "⎘ Copy URL");
let shareLink: HTMLAnchorElement = a({href: "javascript:void(0)", style: "margin: 0 4px;"}, "⤳ Share");
let fullscreenLink: HTMLAnchorElement = a({target: "_top", style: "margin: 0 4px;"}, "⇱ Fullscreen");

let draggingPlayhead: boolean = false;
const playButton: HTMLButtonElement = button({style: "width: 100%; height: 100%; max-height: 50px;"});
const playButtonContainer: HTMLDivElement = div({style: "flex-shrink: 0; display: flex; padding: 2px; width: 80px; height: 100%; box-sizing: border-box; align-items: center;"},
	playButton,
);
const loopIcon: SVGPathElement = path({d: "M 4 2 L 4 0 L 7 3 L 4 6 L 4 4 Q 2 4 2 6 Q 2 8 4 8 L 4 10 Q 0 10 0 6 Q 0 2 4 2 M 8 10 L 8 12 L 5 9 L 8 6 L 8 8 Q 10 8 10 6 Q 10 4 8 4 L 8 2 Q 12 2 12 6 Q 12 10 8 10 z"});
const loopButton: HTMLButtonElement = button({title: "loop", style: "background: none; flex: 0 0 12px; margin: 0 3px; width: 12px; height: 12px; display: flex;"}, svg({width: 12, height: 12, viewBox: "0 0 12 12"},
	loopIcon,
));

const volumeIcon: SVGSVGElement = svg({style: "flex: 0 0 12px; margin: 0 1px; width: 12px; height: 12px;", viewBox: "0 0 12 12"},
	path({fill: ColorConfig.uiWidgetBackground, d: "M 1 9 L 1 3 L 4 3 L 7 0 L 7 12 L 4 9 L 1 9 M 9 3 Q 12 6 9 9 L 8 8 Q 10.5 6 8 4 L 9 3 z"}),
);
const volumeSlider: HTMLInputElement = input({title: "volume", type: "range", value: 75, min: 0, max: 100, step: 1, style: "width: 12vw; max-width: 100px; margin: 0 1px;"});

const zoomIcon: SVGSVGElement = svg({width: 12, height: 12, viewBox: "0 0 12 12"},
	circle({cx: "5", cy: "5", r: "4.5", "stroke-width": "1", stroke: "currentColor", fill: "none"}),
	path({stroke: "currentColor", "stroke-width": "2", d: "M 8 8 L 11 11 M 5 2 L 5 8 M 2 5 L 8 5", fill: "none"}),
);
const zoomButton: HTMLButtonElement = button({title: "zoom", style: "background: none; flex: 0 0 12px; margin: 0 3px; width: 12px; height: 12px; display: flex;"},
	zoomIcon,
);

const timeline: SVGSVGElement = svg({style: "min-width: 0; min-height: 0; touch-action: pan-y pinch-zoom;"});
const playhead: HTMLDivElement = div({style: `position: absolute; left: 0; top: 0; width: 2px; height: 100%; background: ${ColorConfig.playhead}; pointer-events: none;`});
const timelineContainer: HTMLDivElement = div({style: "display: flex; flex-grow: 1; flex-shrink: 1; position: relative;"}, timeline, playhead);
const visualizationContainer: HTMLDivElement = div({style: "display: flex; flex-grow: 1; flex-shrink: 1; height: 0; position: relative; align-items: center; overflow: hidden;"}, timelineContainer);
const visualizerCanvas: HTMLCanvasElement = document.createElement("canvas");
visualizerCanvas.className = "playerVisualizer";
visualizationContainer.appendChild(visualizerCanvas);
const audioTimelineList: HTMLDivElement = div({class: "audioTimelineList"});
const audioTimelineViewport: HTMLDivElement = div({class: "audioTimelineViewport"}, audioTimelineList);
const audioTimeline: HTMLDivElement = div({class: "audioTimeline"},
	div({class: "audioTimelineHeader"}, "Audio tracks"),
	audioTimelineViewport,
);
const startupScreen: HTMLDivElement = div({class: "playerStartup"}, "Loading song...");

visualizationContainer.classList.add("playerVisualization");
document.body.appendChild(startupScreen);
document.body.appendChild(div({class: "playerHeader"}, titleText, songMeta, div({class: "playerLinks"}, editLink, copyLink, shareLink, fullscreenLink)));
document.body.appendChild(visualizationContainer);
document.body.appendChild(audioTimeline);
document.body.appendChild(
	div({class: "playerTransport", style: `flex-shrink: 0; height: 68px; display: flex; align-items: center;`},
		playButtonContainer,
		loopButton,
		volumeIcon,
		volumeSlider,
		zoomButton,
	),
);

// Some browsers have an option to "block third-party cookies" (it's enabled by
// default in icognito Chrome windows) that throws an error on trying to access
// localStorage from cross-domain iframe such as this song player, so wrap the
// access in a try-catch block to ignore the error instead of interrupting
// execution.
function setLocalStorage(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch (error) {
		// Ignore the error since we can't fix it.
	}
}
function getLocalStorage(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch (error) {
		// Ignore the error since we can't fix it.
		return null;
	}
}

function loadSong(songString: string, reuseParams: boolean): void {
	try {
		synth.setSong(songString);
	} catch (error) {
		startupScreen.textContent = "This song could not be loaded.";
		console.error(error);
		return;
	}
	synth.snapToStart();
	syncAudioTrack();
	titleText.textContent = "MyBox Song";
	songMeta.textContent = `${synth.song!.tempo} BPM / ${synth.song!.barCount} bars / ${synth.song!.audioTracks.length} audio ${synth.song!.audioTracks.length == 1 ? "track" : "tracks"}`;
	editLink.href = "../#" + songString;
	startupScreen.remove();
}

function syncAudioTrack(): void {
	for (const playback of audioTracks) {
		playback.element.pause();
		playback.element.removeAttribute("src");
	}
	audioTracks.length = 0;
	if (synth.song == null) return;
	for (const track of synth.song.audioTracks) {
		const element: HTMLAudioElement = document.createElement("audio");
		element.preload = "auto";
		element.src = track.dataUrl;
		element.load();
		const playback: AudioTrackPlayback = {element, gain: null, pan: null, lowpass: null, highpass: null};
		if (audioContext != null) {
			const source = audioContext.createMediaElementSource(element);
			playback.gain = audioContext.createGain();
			playback.pan = audioContext.createStereoPanner();
			playback.lowpass = audioContext.createBiquadFilter();
			playback.highpass = audioContext.createBiquadFilter();
			source.connect(playback.highpass).connect(playback.lowpass).connect(playback.gain).connect(playback.pan).connect(audioAnalyser || audioContext.destination);
		}
		audioTracks.push(playback);
	}
}

function syncAudioPosition(): void {
	if (synth.song == null) return;
	const songBeat = synth.playhead * synth.song.beatsPerBar;
	for (let i: number = 0; i < synth.song.audioTracks.length; i++) {
		const track = synth.song.audioTracks[i];
		const playback = audioTracks[i];
		if (playback == undefined) continue;
		const seconds = Math.max(0, (songBeat - track.startBeat) * 60 / synth.song.tempo);
		if (songBeat < track.startBeat || track.muted) playback.element.pause();
		if (Math.abs(playback.element.currentTime - seconds) > 0.18) playback.element.currentTime = seconds;
		const automatedGain = getAutomatedValue(track, "gain", songBeat, track.gain);
		const automatedPan = getAutomatedValue(track, "pan", songBeat, track.pan);
		const automatedLowpass = getAutomatedValue(track, "lowpass", songBeat, track.lowpass);
		const automatedHighpass = getAutomatedValue(track, "highpass", songBeat, track.highpass);
		const fadeIn = track.fadeIn <= 0 ? 1 : Math.min(1, Math.max(0, (songBeat - track.startBeat) / track.fadeIn));
		const fadeOut = track.fadeOut <= 0 || !isFinite(playback.element.duration) ? 1 : Math.min(1, Math.max(0, (playback.element.duration * synth.song.tempo / 60 - seconds) / track.fadeOut));
		const volume = track.muted || songBeat < track.startBeat ? 0 : automatedGain * fadeIn * fadeOut;
		if (playback.gain != null) playback.gain.gain.value = volume;
		else playback.element.volume = volume;
		if (playback.pan != null) playback.pan.pan.value = automatedPan;
		if (playback.lowpass != null) playback.lowpass.frequency.value = automatedLowpass > 0 ? automatedLowpass : 22050;
		if (playback.highpass != null) playback.highpass.frequency.value = automatedHighpass;
		if (synth.playing && volume > 0 && playback.element.paused) void playback.element.play().catch(() => {});
	}
}

function getAutomatedValue(track: any, target: string, beat: number, fallback: number): number {
	const lane: any = Array.isArray(track.automation) ? track.automation.find((candidate: any) => candidate?.target == target) : null;
	const points: any[] = lane?.points || [];
	if (points.length == 0) return fallback;
	if (beat <= points[0].beat) return points[0].value;
	for (let index: number = 1; index < points.length; index++) {
		if (beat <= points[index].beat) {
			const previous = points[index - 1];
			const current = points[index];
			const ratio = (beat - previous.beat) / Math.max(0.0001, current.beat - previous.beat);
			return previous.value + (current.value - previous.value) * ratio;
		}
	}
	return points[points.length - 1].value;
}

function renderVisualizer(): void {
	const context = visualizerCanvas.getContext("2d");
	if (context == null) return;
	const width = visualizerCanvas.clientWidth;
	const height = visualizerCanvas.clientHeight;
	if (width == 0 || height == 0) return;
	const pixelRatio = window.devicePixelRatio || 1;
	if (visualizerCanvas.width != width * pixelRatio || visualizerCanvas.height != height * pixelRatio) {
		visualizerCanvas.width = width * pixelRatio;
		visualizerCanvas.height = height * pixelRatio;
		context.scale(pixelRatio, pixelRatio);
	}
	context.clearRect(0, 0, width, height);
	if (audioAnalyser == null || !synth.playing) return;
	const values = new Uint8Array(audioAnalyser.frequencyBinCount);
	audioAnalyser.getByteFrequencyData(values);
	const barWidth = Math.max(2, width / values.length - 1);
	for (let i = 0; i < values.length; i++) {
		const barHeight = values[i] / 255 * height;
		context.fillStyle = ColorConfig.linkAccent;
		context.fillRect(i * (barWidth + 1), height - barHeight, barWidth, barHeight);
	}
}

function renderAudioTimeline(): void {
	if (synth.song == null || synth.song.audioTracks.length == 0) {
		audioTimeline.style.display = "none";
		return;
	}
	audioTimeline.style.display = "";
	audioTimelineList.textContent = "";
	audioTimelineList.style.width = timelineWidth + "px";
	const totalBeats: number = synth.song.barCount * synth.song.beatsPerBar;
	for (const track of synth.song.audioTracks) {
		const lane: HTMLDivElement = div({class: "audioTimelineLane", style: `width: ${timelineWidth}px;`});
		const start: number = Math.max(0, Math.min(totalBeats, Number(track.startBeat) || 0));
		const left: number = timelineWidth * start / totalBeats;
		const clipWidth: number = Math.max(120, Math.min(timelineWidth - left, timelineWidth * 0.24));
		const clip: HTMLDivElement = div({class: "audioTimelineClip", style: `left: ${left}px; width: ${clipWidth}px; opacity: ${track.muted ? 0.45 : 1};`}, track.name);
		lane.appendChild(clip);
		if (Array.isArray(track.automation)) {
			for (const automation of track.automation) {
				const points: any[] = Array.isArray(automation.points) ? automation.points : [];
				if (points.length < 1) continue;
				const curve = document.createElementNS("http://www.w3.org/2000/svg", "svg");
				curve.setAttribute("class", "audioAutomationCurve");
				curve.setAttribute("viewBox", `0 0 ${timelineWidth} 38`);
				curve.setAttribute("preserveAspectRatio", "none");
				const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
				const maxValue = automation.target == "pan" ? 1 : automation.target == "gain" ? 1 : 22050;
				const minValue = automation.target == "pan" ? -1 : 0;
				const pathData = points.map((point: any, index: number) => {
					const x = totalBeats <= 0 ? 0 : Math.max(0, Math.min(timelineWidth, timelineWidth * Number(point.beat || 0) / totalBeats));
					const normalized = Math.max(0, Math.min(1, (Number(point.value || 0) - minValue) / Math.max(1, maxValue - minValue)));
					const y = 34 - normalized * 28;
					return `${index == 0 ? "M" : "L"} ${x} ${y}`;
				}).join(" ");
				path.setAttribute("d", pathData);
				path.setAttribute("fill", "none");
				path.setAttribute("stroke", ColorConfig.primaryText);
				path.setAttribute("stroke-width", "1.5");
				curve.appendChild(path);
				lane.appendChild(curve);
			}
		}
		audioTimelineList.appendChild(lane);
	}
}

function hashUpdatedExternally(): void {
	let myHash: string = location.hash;
	if (prevHash == myHash || myHash == "") return;
	
	prevHash = myHash;
	
	if (myHash.charAt(0) == "#") {
		myHash = myHash.substring(1);
	}
	
	fullscreenLink.href = location.href;
	const hashQueryParams = new URLSearchParams(myHash);
	const songParameter = hashQueryParams.get("song");
	if (songParameter != null) {
		loadSong(songParameter, true);
		const loopParameter = hashQueryParams.get("loop");
		if (loopParameter != null) {
			synth.loopRepeatCount = loopParameter == "1" ? -1 : 0;
			renderLoopIcon();
		}
	} else {
		try {
			loadSong(decodeURIComponent(myHash), false);
		} catch (error) {
			startupScreen.textContent = "This song could not be loaded.";
			console.error(error);
		}
	}
	
	renderTimeline();
}

function onWindowResize(): void {
	renderTimeline();
}

let pauseIfAnotherPlayerStartsHandle: ReturnType<typeof setInterval> | null = null;
function pauseIfAnotherPlayerStarts(): void {
	if (!synth.playing) {
		clearInterval(pauseIfAnotherPlayerStartsHandle!);
		return;
	}
	
	const storedPlayerId: string | null = getLocalStorage("playerId");
	if (storedPlayerId != null && storedPlayerId != id) {
		onTogglePlay();
		renderPlayhead();
		clearInterval(pauseIfAnotherPlayerStartsHandle!);
	}
}

function animate(): void {
	if (synth.playing) {
		animationRequest = requestAnimationFrame(animate);
		renderPlayhead();
		renderVisualizer();
	}
	if (pauseButtonDisplayed != synth.playing) {
		renderPlayButton();
	}
}

function onTogglePlay(): void {
	if (synth.song != null) {
		if (animationRequest != null) cancelAnimationFrame(animationRequest);
		animationRequest = null;
		if (synth.playing) {
			synth.pause();
			for (const playback of audioTracks) playback.element.pause();
		} else {
			syncAudioPosition();
			synth.play();
			for (const playback of audioTracks) {
				const context: any = playback.gain?.context;
				if (context != null && context.resume != undefined) void context.resume();
				if (playback.element.volume > 0 || playback.gain != null) void playback.element.play();
			}
			setLocalStorage("playerId", id);
			animate();
			clearInterval(pauseIfAnotherPlayerStartsHandle!);
			pauseIfAnotherPlayerStartsHandle = setInterval(pauseIfAnotherPlayerStarts, 100);
		}
	}
	renderPlayButton();
}

function onToggleLoop(): void {
	if (synth.loopRepeatCount == -1) {
		synth.loopRepeatCount = 0;
	} else {
		synth.loopRepeatCount = -1;
	}
	renderLoopIcon();
}

function onVolumeChange(): void {
	setLocalStorage("volume", volumeSlider.value);
	setSynthVolume();
}

function onToggleZoom(): void {
	zoomEnabled = !zoomEnabled;
	renderZoomIcon();
	renderTimeline();
}

function onTimelineMouseDown(event: MouseEvent): void {
	draggingPlayhead = true;
	onTimelineMouseMove(event);
}

function onTimelineMouseMove(event: MouseEvent): void {
	if (!draggingPlayhead) return;
	event.preventDefault();
	onTimelineCursorMove(event.clientX || event.pageX);
}

function onTimelineTouchDown(event: TouchEvent): void {
	draggingPlayhead = true;
	onTimelineTouchMove(event);
}

function onTimelineTouchMove(event: TouchEvent): void {
	onTimelineCursorMove(event.touches[0].clientX);
}

function onTimelineCursorMove(mouseX: number): void {
	if (draggingPlayhead && synth.song != null) {
		const boundingRect: ClientRect = visualizationContainer.getBoundingClientRect();
		synth.playhead = synth.song.barCount * (mouseX - boundingRect.left) / (boundingRect.right - boundingRect.left);
		renderPlayhead();
	}
}

function onTimelineCursorUp(): void {
	draggingPlayhead = false;
}

function setSynthVolume(): void {
	const volume: number = +volumeSlider.value;
	synth.volume = Math.min(1.0, Math.pow(volume / 50.0, 0.5)) * Math.pow(2.0, (volume - 75.0) / 25.0);
}

function renderPlayhead(): void {
	if (synth.song != null) {
		syncAudioPosition();
		let pos: number = synth.playhead / synth.song.barCount;
		playhead.style.left = (timelineWidth * pos) + "px";
		
		const boundingRect: ClientRect = visualizationContainer.getBoundingClientRect();
		visualizationContainer.scrollLeft = pos * (timelineWidth - boundingRect.width);
		audioTimelineList.style.transform = `translateX(-${visualizationContainer.scrollLeft}px)`;
	}
}

function renderTimeline(): void {
	timeline.innerHTML = "";
	if (synth.song == null) return;
	
	const boundingRect: ClientRect = visualizationContainer.getBoundingClientRect();
	
	let timelineHeight: number;
	let windowOctaves: number;
	let windowPitchCount: number;
	
	if (zoomEnabled) {
		timelineHeight = boundingRect.height;
		windowOctaves = Math.max(1, Math.min(Config.pitchOctaves, Math.round(timelineHeight / (12 * 2))));
		windowPitchCount = windowOctaves * 12 + 1;
		const semitoneHeight: number = (timelineHeight - 1) / windowPitchCount;
		const targetBeatWidth: number = Math.max(8, semitoneHeight * 4);
		timelineWidth = Math.max(boundingRect.width, targetBeatWidth * synth.song.barCount * synth.song.beatsPerBar);
	} else {
		timelineWidth = boundingRect.width;
		const targetSemitoneHeight: number = Math.max(1, timelineWidth / (synth.song.barCount * synth.song.beatsPerBar) / 3);
		timelineHeight = Math.min(boundingRect.height, targetSemitoneHeight * (Config.maxPitch + 1) + 1);
		windowOctaves = Math.max(3, Math.min(Config.pitchOctaves, Math.round(timelineHeight / (12 * targetSemitoneHeight))));
		windowPitchCount = windowOctaves * 12 + 1;
	}
	
	timelineContainer.style.width = timelineWidth + "px";
	timelineContainer.style.height = timelineHeight + "px";
	timeline.style.width = timelineWidth + "px";
	timeline.style.height = timelineHeight + "px";
	
	const barWidth: number = timelineWidth / synth.song.barCount;
	const partWidth: number = barWidth / (synth.song.beatsPerBar * Config.partsPerBeat);
	const wavePitchHeight: number = (timelineHeight-1) / windowPitchCount;
	const drumPitchHeight: number =  (timelineHeight-1) / Config.drumCount;
	
	for (let bar: number = 0; bar < synth.song.barCount + 1; bar++) {
		const color: string = (bar == synth.song.loopStart || bar == synth.song.loopStart + synth.song.loopLength) ? ColorConfig.loopAccent : ColorConfig.uiWidgetBackground;
		timeline.appendChild(rect({x: bar * barWidth - 1, y: 0, width: 2, height: timelineHeight, fill: color}));
	}
	
	for (let octave: number = 0; octave <= windowOctaves; octave++) {
		timeline.appendChild(rect({x: 0, y: octave * 12 * wavePitchHeight, width: timelineWidth, height: wavePitchHeight + 1, fill: ColorConfig.tonic, opacity: 0.75}));
	}
	
	for (let channel: number = synth.song.channels.length - 1; channel >= 0; channel--) {
		const isNoise: boolean = synth.song.getChannelIsNoise(channel);
		const pitchHeight: number = isNoise ? drumPitchHeight : wavePitchHeight;
		
		const configuredOctaveScroll: number = synth.song.channels[channel].octave;
		const newOctaveScroll: number = Math.max(0, Math.min(Config.pitchOctaves - windowOctaves, Math.ceil(configuredOctaveScroll - windowOctaves * 0.5)));
		
		const offsetY: number = newOctaveScroll * pitchHeight * 12 + timelineHeight - pitchHeight * 0.5 - 0.5;
		
		for (let bar: number = 0; bar < synth.song.barCount; bar++) {
			const pattern: Pattern | null = synth.song.getPattern(channel, bar);
			if (pattern == null) continue;
			const offsetX: number = bar * barWidth;
			
			for (let i: number = 0; i < pattern.notes.length; i++) {
				const note: Note = pattern.notes[i];
				
				for (const pitch of note.pitches) {
					const d: string = drawNote(pitch, note.start, note.pins, (pitchHeight + 1) / 2, offsetX, offsetY, partWidth, pitchHeight);
					const noteElement: SVGPathElement = path({d: d, fill: ColorConfig.getChannelColor(synth.song, channel).primaryChannel});
					if (isNoise) noteElement.style.opacity = String(0.6);
					timeline.appendChild(noteElement);
				}
			}
		}
	}
	
	renderAudioTimeline();
	renderPlayhead();
}

function drawNote(pitch: number, start: number, pins: NotePin[], radius: number, offsetX: number, offsetY: number, partWidth: number, pitchHeight: number): string {
	let d: string = `M ${offsetX + partWidth * (start + pins[0].time)} ${offsetY - pitch * pitchHeight + radius * (pins[0].size / Config.noteSizeMax)} `; 
	for (let i: number = 0; i < pins.length; i++) {
		const pin: NotePin = pins[i];
		const x:   number = offsetX + partWidth * (start + pin.time);
		const y: number = offsetY - pitchHeight * (pitch + pin.interval);
		const expression: number = pin.size / Config.noteSizeMax;
		d += `L ${x} ${y - radius * expression} `;
	}
	for (let i: number = pins.length - 1; i >= 0; i--) {
		const pin: NotePin = pins[i];
		const x:   number = offsetX + partWidth * (start + pin.time);
		const y: number = offsetY - pitchHeight * (pitch + pin.interval);
		const expression: number = pin.size / Config.noteSizeMax;
		d += `L ${x} ${y + radius * expression} `;
	}
	return d;
}

function renderPlayButton(): void {
	if (synth.playing) {
		playButton.classList.remove("playButton");
		playButton.classList.add("pauseButton");
		playButton.title = "Pause (Space)";
		playButton.textContent = "Pause";
	} else {
		playButton.classList.remove("pauseButton");
		playButton.classList.add("playButton");
		playButton.title = "Play (Space)";
		playButton.textContent = "Play";
	}
	pauseButtonDisplayed = synth.playing;
}

function renderLoopIcon(): void {
	loopIcon.setAttribute("fill", (synth.loopRepeatCount == -1) ? ColorConfig.linkAccent : ColorConfig.uiWidgetBackground);
}

function renderZoomIcon(): void {
	zoomIcon.style.color = zoomEnabled ? ColorConfig.linkAccent : ColorConfig.uiWidgetBackground;
}

function onKeyPressed(event: KeyboardEvent): void {
	switch (event.keyCode) {
		case 32: // space
			onTogglePlay();
			event.preventDefault();
			break;
		case 219: // left brace
			synth.goToPrevBar();
			renderPlayhead();
			event.preventDefault();
			break;
		case 221: // right brace
			synth.goToNextBar();
			renderPlayhead();
			event.preventDefault();
			break;
	}
}

function onCopyClicked(): void {
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(location.href).catch(()=>{
			window.prompt("Copy to clipboard:", location.href);
		});
		return;
	}
	const textField: HTMLTextAreaElement = document.createElement("textarea");
	textField.textContent = location.href;
	document.body.appendChild(textField);
	textField.select();
	const succeeded: boolean = document.execCommand("copy");
	textField.remove();
	if (!succeeded) window.prompt("Copy this:", location.href);
}

function onShareClicked(): void {
	(<any>navigator).share({ url: location.href });
}

if ( top !== self ) {
	// In an iframe.
	copyLink.style.display = "none";
	shareLink.style.display = "none";
} else {
	// Fullscreen.
	fullscreenLink.style.display = "none";
	if (!("share" in navigator)) shareLink.style.display = "none";
}

if (getLocalStorage("volume") != null) {
	volumeSlider.value = getLocalStorage("volume")!;
}
setSynthVolume();

window.addEventListener("resize", onWindowResize);
window.addEventListener("keydown", onKeyPressed);

timeline.addEventListener("mousedown", onTimelineMouseDown);
window.addEventListener("mousemove", onTimelineMouseMove);
window.addEventListener("mouseup", onTimelineCursorUp);
timeline.addEventListener("touchstart", onTimelineTouchDown);
timeline.addEventListener("touchmove", onTimelineTouchMove);
timeline.addEventListener("touchend", onTimelineCursorUp);
timeline.addEventListener("touchcancel", onTimelineCursorUp);

playButton.addEventListener("click", onTogglePlay);
loopButton.addEventListener("click", onToggleLoop);
volumeSlider.addEventListener("input", onVolumeChange);
zoomButton.addEventListener("click", onToggleZoom);
copyLink.addEventListener("click", onCopyClicked);
shareLink.addEventListener("click", onShareClicked);
window.addEventListener("hashchange", hashUpdatedExternally);

hashUpdatedExternally();
renderLoopIcon();
renderZoomIcon();
renderPlayButton();

// When compiling synth.ts as a standalone module named "mybox", expose these classes as members to JavaScript:
export {Dictionary, DictionaryArray, EnvelopeType, InstrumentType, Transition, Chord, Envelope, Config, NotePin, Note, Pattern, Instrument, Channel, Synth};
