// Copyright (c) John Nesky and contributing authors, distributed under the MIT license, see accompanying the LICENSE.md file.

import {SongDocument} from "./SongDocument.js";
import {RecoveredSong, RecoveredVersion, SongRecovery, versionToKey} from "./SongRecovery.js";
import {Prompt} from "./Prompt.js";
import {ChangeSong} from "./changes.js";
import {HTML} from "imperative-html/dist/esm/elements-strict.js";

const {button, div, h2, p, select, option, iframe} = HTML;

export class SongRecoveryPrompt implements Prompt {
	private readonly _songContainer: HTMLDivElement = div();
	private readonly _cancelButton: HTMLButtonElement = button({class: "cancelButton"});
	
	public readonly container: HTMLDivElement = div({class: "prompt", style: "width: 300px;"},
		h2("Song Recovery"),
		div({style: "max-height: 385px; overflow-y: auto;"},
			p("This is a TEMPORARY list of songs you have recently modified. Please keep your own backups of songs you care about!"),
			this._songContainer,
			p("(If \"Display Song Data in URL\" is enabled in your preferences, then you may also be able to find song versions in your browser history. However, song recovery won't work if you were browsing in private/incognito mode.)"),
		),
		this._cancelButton,
	);
	
	constructor(private _doc: SongDocument) {
		this._cancelButton.addEventListener("click", this._close);
		
		const songs: RecoveredSong[] = SongRecovery.getAllRecoveredSongs();
		
		if (songs.length == 0) {
			this._songContainer.appendChild(p("There are no recovered songs available yet. Try making a song!"));
		}
		
		for (const song of songs) {
			const versionMenu: HTMLSelectElement = select({style: "width: 100%;"});
			
			for (const version of song.versions) {
				versionMenu.appendChild(option({value: version.time}, new Date(version.time).toLocaleString()));
			}
			
			const player: HTMLIFrameElement = iframe({style: "width: 100%; height: 60px; border: none; display: block;"});
			const restoreButton: HTMLButtonElement = button({type: "button", style: "width: 100%; margin-top: 3px;"}, "Restore Selected Song");
			const container: HTMLDivElement = div({style: "margin: 4px 0;"}, div({class: "selectContainer", style: "width: 100%; margin: 2px 0;"}, versionMenu), player, restoreButton);
			this._songContainer.appendChild(container);
			this._showVersion(player, song.versions[0]);
			
			versionMenu.addEventListener("change", () => {
				const version: RecoveredVersion = song.versions[versionMenu.selectedIndex];
				this._showVersion(player, version);
			});
			restoreButton.addEventListener("click", () => {
				const version: RecoveredVersion = song.versions[versionMenu.selectedIndex];
				const songData: string | null = window.localStorage.getItem(versionToKey(version));
				if (songData == null) return;
				this._doc.record(new ChangeSong(this._doc, songData), true);
				this._doc.prompt = null;
				this._doc.renderNow();
			});
		}
	}

	private _showVersion(player: HTMLIFrameElement, version: RecoveredVersion): void {
		const key: string = versionToKey(version);
		player.src = "player/#recovery=" + encodeURIComponent(key);
	}
	
	private _close = (): void => { 
		this._doc.undo();
	}
	
	public cleanUp = (): void => { 
		this._cancelButton.removeEventListener("click", this._close);
	}
}
