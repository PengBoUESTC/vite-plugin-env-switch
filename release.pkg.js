module.exports = {
  releaseBranch: ['master', 'main'], // which git branch can be released
  releaseUser: ['pengbo-study'], // who can publish this pkg
  release: true, // auto publish or not
  scripts: {
    build: 'build', // if exist, run build command
    changelog: 'changelog', //if exist, run changelog command
  },
  tag: true // need git tag?
};