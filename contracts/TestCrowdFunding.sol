pragma solidity >=0.4.21 <0.6.0;
import './CrowdFunding.sol';

contract TestCrowdFunding is CrowdFunding {
  uint time;

  constructor(
    string memory contractName,
    uint targetAmountEth,
    uint durationInMins,
    address payable beneficiaryAddress
  ) CrowdFunding(
    contractName,
    targetAmountEth,
    durationInMins,
    beneficiaryAddress
    ) public {
  }

  function currentTime() internal view returns(uint) {
    return time;
  }

  function setCurrentTime(uint newTime) public {
    time = newTime;
  }
}
