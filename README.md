iff
===

You write code made of frameworks, toolboxes and libraries from all over. Sometimes all that code can be difficult to keep track of, so iff takes care of the magic for you.  Iff seemlessly tracks your program's metadata in a manifest file 'iff.json', so you can install, update or even publish your data from the command line.

Iff also makes it easy to find packages to suit your needs.  When you publish packages with iff, they'll show up on the official package listing, making it easy to collaborate, share or just show off.


###usage
===

####manifest

An iff manifest file 'iff.json' is a simple JSON file with the fields:

```json
{
  "name" : "project_name",
  "author" : "Jon",
  "description" : "about the module",
  "version" : "0.0.1",
  "repository" : "git@github.com/jonbrennecke/iff.git",
  "main" : "main.m",
  "dependencies" : [
    "some", 
    "other",
    "modules"
  ],
  "keywords" : [
    "some",
    "keywords",
    "here"
  ]
}

```

Iff will walk you through creating a manifest, just type ```iff init``` in your terminal.


####building MEX files

Iff contains an (experimental) build generator for C or C++ MEX projects. To use it, type ```iff build``` in the terminal.

