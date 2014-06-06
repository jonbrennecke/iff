#MBot

MBot is a package manager for Matlab/Octave. It's a work-in-progress currently, but nearing completion.

MBot is written in [Node.js](http://nodejs.org/) and requires both Node and (Node's own package manager) [NPM](https://www.npmjs.org/) to run. It also depends on [git](https://help.github.com/articles/set-up-git) to install packages.

###Installation:

You can install MBot by typing the following in your shell:
```
npm install mbot
```

MBot is now installed locally; to use mbot as an executable type:
```
npm link
```

####Usage:

MBot's command-line interface is designed to be ver similar to NPM.  
So far, the command options are:
  - install
  - init
  - publish
  - config
  - help

#### install
```
mbot install <package>
```

#### init
```
mbot init [folder]
```
