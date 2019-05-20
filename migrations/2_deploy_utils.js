let Utils = artifacts.require('./Utils.sol')
let CrowdFundingWithDeadline = artifacts.require('./CrowdFunding.sol')
let TestCrowdFundingWithDeadline = artifacts.require('./TestCrowdFunding.sol')

module.exports = async function(deployer) {
  await deployer.deploy(Utils)
  deployer.link(Utils, CrowdFundingWithDeadline)
  deployer.link(Utils, TestCrowdFundingWithDeadline)
}
