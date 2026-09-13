# My Box Lemon
> A literal DAW (yet to be). IN THE BROWSER!

This project is owned and affiliated with [OpenFiddles](https://github.com/OpenFiddles), this is my burner account for temporary access to github. (Xily-random-account)
## About MBL 
Don’t question why there is _Lemon_ in its name, it was originally ***My Box***, but _Vercel_ made it 100x better. I did not intend for it to be a _Lemon_, but Vercel gave it to me as:
> https://my-box-lemon.vercel.app

But MBL is planning to be what it says, a literal DAW, in the browser. Developed by [Alyshia](https://github.com/xi-self13), and thanks to the original creator, ***[John Nesky](https://johnnesky.com/)*** for making it open-sourced under the MIT License and making it free to be. MBL is currently in **Alpha** as so far as the overhaul, so far, we got:
### What’s New :3
* Overhauled the UI 
* Added a basic audio file tracks, and player (SUPER BUGGY![^1])
* Added an automation system (it’s still envelopes for now, ALPHA!)

### What Broke :[
* Service worker wont cache the site.
* Deleting Audio can corrupt your song data and unhash it!
* The url data unhashes for some reason and puts the full JSON in the URL Bar. (OKAY, kinda)
* ~~Song Player Broke~~ (FIXED!)
* Report more at [Issues](https://github.com/xily-random-account/MyBox/issues).

I’m planning to go more Logic Pro by Apple style. But not so complicated to where the caching system breaks! Also planning to make it natively run on Windows, MacOS, Linux, Android, and IOS[^2]. Also what that saying, its gonna be complicated, but it will need to download what it needs on the spot (Like plugins, the encoder (or use the lightest version, the one beepbox uses). I’ve currently fixed the interface to zoom without the text at the bottom (later implemented in its own dialog).
## Cloning The Project

To clone, run:
```batch 
git clone https://github.com/xily-random-account/MyBox.git
```

Then create and cd into your directory:
```batch
mkdir MyBox && cd MyBox
```

Then install the required depends using this command:
```batch
npm install
```
## How to build it!
The DAW has 3 parts to build: **The Syth Engine, Song Player, and The Editor DAW itself.** Node.js and NPM is required to build.

### Syth
To build the Synthesizer Engine, you got to run:
```batch
npm run build-synth
```

### Editor
To build the DAW Editor, you run:
```batch
npm run build-editor
```

### Player
To build the Song Player, you run:
```batch
npm run build-player
```

### 1 Full Build
It comes fully equipped to automatically build everything, run:
```batch
npm run build
```

## Power Command
1 full block to make your life easier!
```batch
git clone https://github.com/xily-random-account/MyBox.git
mkdir MyBox && cd MyBox
npm install
npm run build
```

## Contributing
See **CONTRIBUTE.md**
[^1]: When you delete the audio file, it corrupts your song data. Use carefully!
[^2]: Unsure!