const BigNumber = require('bignumber.js')

const CrowdFunding = artifacts.require('./TestCrowdFunding.sol')

contract('Crowd Funding', accounts => {
  let contract
  const contractCreator = accounts[0]
  const beneficiary = accounts[1]
  const ONE_ETH = new BigNumber(1e18)
  const ONGOING_STATE = 0
  const FAILED_STATE = 1
  const SUCCEEDED_STATE = 2
  const PAID_OUT_STATE = 3

  beforeEach(async () => {
    contract = await CrowdFunding.new('test funding', 1, 10, beneficiary, {
      from: contractCreator,
      gas: 2000000,
    })
  })

  it('initializes the contract correctly', async () => {
    const name = await contract.name.call()
    expect(name).to.equal('test funding')
    const targetAmount = await contract.targetAmount.call()
    expect(ONE_ETH.isEqualTo(targetAmount)).to.equal(true)
    const fundingDeadline = await contract.fundingDeadline.call()
    expect(fundingDeadline.toNumber()).to.equal(600)
    const beneficiaryAddress = await contract.beneficiary.call()
    expect(beneficiaryAddress).to.equal(beneficiary)
  })

  it('should correctly fund the campaign', async () => {
    await contract.contribute({
      value: ONE_ETH,
      from: contractCreator,
    })
    const contributed = await contract.amounts.call(contractCreator)
    expect(ONE_ETH.isEqualTo(contributed)).to.equal(true)

    const totalCollected = await contract.totalCollected.call()
    expect(ONE_ETH.isEqualTo(totalCollected)).to.equal(true)
  })

  it('should not allow contributions after the deadline', async () => {
    try {
      await contract.setCurrentTime(601)
      await contract.sendTransaction({
        value: ONE_ETH,
        from: contractCreator,
      })
      expect.fail()
    } catch (error) {
      expect(error.message).to.equal(
        'Returned error: VM Exception while processing transaction: revert',
      )
    }
  })

  it('should correctly succeed the crowd funding', async function() {
    await contract.contribute({ value: ONE_ETH, from: contractCreator })
    await contract.setCurrentTime(601)
    await contract.finishCrowdFunding()
    let state = await contract.currentState.call()

    expect(state.valueOf().toNumber()).to.equal(SUCCEEDED_STATE)
  })
  it('should correctly fail the crowd funding', async function() {
    await contract.setCurrentTime(601)
    await contract.finishCrowdFunding()
    let state = await contract.currentState.call()

    expect(state.valueOf().toNumber()).to.equal(FAILED_STATE)
  })

  it('should collect money paid', async function() {
    await contract.contribute({ value: ONE_ETH, from: contractCreator })
    await contract.setCurrentTime(601)
    await contract.finishCrowdFunding()

    let initAmount = await web3.eth.getBalance(beneficiary)
    await contract.collect({ from: contractCreator })

    let newBalance = await web3.eth.getBalance(beneficiary)
    let difference = newBalance - initAmount
    expect(ONE_ETH.isEqualTo(difference)).to.equal(true)

    let fundingState = await contract.currentState.call()
    expect(fundingState.valueOf().toNumber()).to.equal(PAID_OUT_STATE)
  })

  it('should withdraw funds from the contract', async function() {
    await contract.contribute({ value: ONE_ETH - 100, from: contractCreator })
    await contract.setCurrentTime(601)
    await contract.finishCrowdFunding()

    await contract.withdraw({ from: contractCreator })
    let amount = await contract.amounts.call(contractCreator)
    expect(amount.toNumber()).to.equal(0)
  })

  it('should emit an event after campaign finishes.', async function() {
    await contract.setCurrentTime(601)
    const transaction = await contract.finishCrowdFunding()

    const events = transaction.logs
    expect(events.length).to.equal(1)

    const event = events[0]
    expect(event.args.totalCollected.toNumber()).to.equal(0)
    expect(event.args.succeeded).to.equal(false)
  })
})
