pragma solidity >=0.4.21 <0.6.0;

import "./Utils.sol";

contract CrowdFunding {
  enum State { Ongoing, Failed, Succeeded, PaidOut }

  string public name;
  uint public targetAmount;
  uint public fundingDeadline;
  address payable public beneficiary;
  State public currentState;
  mapping(address => uint) public amounts;
  bool public succeeded;
  uint public totalCollected;

  event CampaignFinished(
    address addr,
    uint totalCollected,
    bool succeeded
  );

  modifier inState(State expectedState) {
    require(currentState == expectedState, 'Invalid state.');
    _;
  }
  modifier isActive {
    require(currentTime() < fundingDeadline, 'Campaign has closed.');
    _;
  }
  constructor(
    string memory contractName,
    uint targetAmountEth,
    uint durationInMins,
    address payable beneficiaryAddress
  ) public {
    name = contractName;
    targetAmount = Utils.etherToWei(targetAmountEth);
    fundingDeadline = currentTime() + Utils.minutesToSeconds(durationInMins);
    beneficiary = beneficiaryAddress;
  }

  function contribute() public payable inState(State.Ongoing) isActive {
    amounts[msg.sender] += msg.value;
    totalCollected += msg.value;
    if(totalCollected >= targetAmount) {
      succeeded = true;
    }
  }

  function finishCrowdFunding() public inState(State.Ongoing) {
    require(currentTime() > fundingDeadline, 'Cannot finish campaign before a deadline.');
    if (!succeeded) {
      currentState = State.Failed;
    } else {
      currentState = State.Succeeded;
    }
    emit CampaignFinished(address(this), totalCollected, succeeded);
  }

  function collect() public inState(State.Succeeded) {
    if (beneficiary.send(totalCollected)) {
      currentState = State.PaidOut;
    } else {
      currentState = State.Failed;
    }
  }

  function withdraw() public inState(State.Failed) {
    require(amounts[msg.sender] > 0, "Nothing was contributed");
    uint contributed = amounts[msg.sender];
    msg.sender.transfer(contributed);
    amounts[msg.sender] = 0;
  }

  function currentTime() internal view returns(uint) {
    return block.timestamp;
  }
}