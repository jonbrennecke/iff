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

MBot's command-line interface is designed to be very similar to NPM.  
So far, the command options are:


```
Usage: mbot [options]

Options:
	install <package>	Query the API for a given package; and if it's found,
						download it, unpack it and add it to the matlab path.

	init [folder]		Interactively create a package structure in a folder (or
						the current directory, if no folder is provided).

	publish [folder]	If 'folder' is a module, publish the module by
						registering it with the API.

	config <key=value>	Set a key value pair in the config file.\n\n" +

	help				Display this prompt.
```
