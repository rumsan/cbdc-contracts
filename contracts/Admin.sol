//SPDX-License-Identifier: LGPL-3.0

pragma solidity 0.8.7;

import "./ERC20_CBDC.sol";
import "./Regulator.sol";

/// @title Regulator Admin contract - owns all the tokens initially minted
/// @author Rumsan Associates
/// @notice You can use this contract to manage Regulator tokens and projects
/// @dev All function calls are only executed by contract owner
contract Admin {
  using EnumerableSet for EnumerableSet.UintSet;

  event ProjectERC20BudgetUpdated(
    bytes32 indexed projectId,
    uint256 projectCapital,
    string tag
  );
  event Minted(bool success);

  // uint256 public mintData ;
  // bool public mintSuccess =false;

  RahatERC20 public erc20;
  Regulator public regulatorContract;
  mapping(address => bool) public owner;
  //EnumerableSet.UintSet private tokenIds;

  /// @notice list of projects
  bytes32[] public projectId;

  //NFTs minted for each project

  /// @notice check if projectId exists or not;
  mapping(bytes32 => bool) public projectExists;

  /// @notice assign budgets to project
  mapping(bytes32 => uint256) public projectERC20Capital;

  modifier OnlyOwner() {
    require(
      owner[msg.sender],
      "RAHAT_ADMIN: Only Admin can execute this transaction"
    );
    _;
  }

  modifier CheckProject(string memory _projectId) {
    bytes32 _id = findHash(_projectId);
    if (projectExists[_id]) {
      _;
    } else {
      projectId.push(_id);
      projectExists[_id] = true;
      _;
    }
  }

  /// @notice All the supply is allocated to this contract
  /// @dev deploys AidToken and Regulator contract by sending supply to this contract

  constructor(
    RahatERC20 _erc20,
    Regulator _regulatorContract,
    uint256 _intitialSupply,
    address _admin
  ) {
    erc20 = _erc20;
    regulatorContract = _regulatorContract;
    erc20.mintERC20(address(this), _intitialSupply);
    //(bool success, bytes memory result) = address(_tokenContract).call(abi.encodeWithSignature("mintERC20(address, uint256)", address(this), _intitialSupply));
    //mintSuccess = success;
    //mintData = abi.decode(result,(uint256));

    owner[_admin] = true;
  }

  /// @notice allocate token to projects
  /// @dev Allocates token to the given projectId, Creates project and transfer tokens to Regulator contract.
  /// @param _projectId Unique Id of Project
  /// @param _totalAmount Budget Allocated to project

  // bytes32 _projectId,
  // uint256 _disbursementAmount,
  // uint256 _disbursementFrequency,
  // uint256 _startDate,
  // uint256 _endDate,
  // uint256 _totalAmount
  function setProjectBudget_ERC20(
    string memory _projectId,
    uint256 _disbursementAmount,
    uint256 _disbursementFrequency,
    uint256 _startDate,
    uint256 _endDate,
    uint256 _totalAmount
  ) public OnlyOwner CheckProject(_projectId) {
    bytes32 _id = findHash(_projectId);
    projectERC20Capital[_id] += _totalAmount;
    erc20.transfer(address(regulatorContract), _totalAmount);
    regulatorContract.allocateBudgetToProject(
      _id,
      _disbursementAmount,
      _disbursementFrequency,
      _startDate,
      _endDate,
      _totalAmount
    );

    emit ProjectERC20BudgetUpdated(_id, _totalAmount, "add");
  }

  /// @notice get the current balance of project
  /// @param _projectId Unique Id of project
  function getProjecERC20Balance(string memory _projectId)
    public
    view
    returns (uint256 _balance)
  {
    bytes32 _id = findHash(_projectId);
    require(projectExists[_id], "RAHAT_ADMIN: Invalid ProjectID");
    return (regulatorContract.getProjectBalance(_id));
  }

  /// @notice mint new tokens
  /// @param _address address to send the minted tokens
  /// @param _amount Amount of token to Mint
  function mintERC20(address _address, uint256 _amount) public OnlyOwner {
    erc20.mintERC20(_address, _amount);
  }

  /// @notice Add an account to the owner role. Restricted to owners.
  /// @param _account address of new owner
  function addOwner(address _account) public OnlyOwner {
    owner[_account] = true;
  }

  /// @notice generates the hash of the given string
  /// @param _data String of which hash is to be generated
  function findHash(string memory _data) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(_data));
  }
}
