const CrowdFunding = artifacts.require('./CrowdFunding.sol')

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(CrowdFunding, 'test funding', 1, 20, accounts[0])
}
