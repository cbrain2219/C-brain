module.exports = {
  hooks: {
    readPackage(packageJson) {
      // POPBiLL 1.64.2 accidentally publishes an unused `popbill: file:` self-dependency.
      if (packageJson.name === "popbill" && packageJson.version === "1.64.2") {
        delete packageJson.dependencies?.popbill;
      }

      return packageJson;
    },
  },
};
