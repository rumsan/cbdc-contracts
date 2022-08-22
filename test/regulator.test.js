const Regulator = artifacts.require("Regulator");
const RahatERC20 = artifacts.require("RahatERC20");
const Admin = artifacts.require("Admin");
// const RahatABI = require("../artifacts/contracts/Regulator.sol/Regulator.json")


// const getInterface = (contractName,functionName) => {
//   const {abi}  = require(`../artifacts/contracts/${contractName}.sol/${contractName}`)
//   if(!abi) throw Error("Contract Not Found");
//   const interface = abi.find((el)=> el.name === functionName);
//   console.log({interface})
//   return interface 
// }

describe("Regulator contract", function() {
  let rahatERC20;
  let regulator;
  let serverRole;
  let adminRole;
  let vendorRole;
  let mobilizerRole;
  let managerRole;
  let adminContract;
  const phone1 = 1111111111;
  const phone2 = 2222222222;
  const phone3 = 3333333333;
  const otp = '9670'
  const otpHash = web3.utils.soliditySha3({type: 'string', value: otp});


  before(async function() {
    [deployer,admin,server,vendor,manager,mobilizer,addr1] = await web3.eth.getAccounts();
    rahatERC20 = await RahatERC20.new("Regulator","RHT",deployer);
    regulator = await Regulator.new(rahatERC20.address,deployer)
    adminContract = await Admin.new(rahatERC20.address,regulator.address,10000000,deployer)
    serverRole = await regulator.SERVER_ROLE();
    adminRole = await regulator.DEFAULT_ADMIN_ROLE();
    serverRole = await regulator.SERVER_ROLE();
    managerRole = await regulator.MANAGER_ROLE();
    mobilizerRole = await regulator.MOBILIZER_ROLE();
    vendorRole = await regulator.VENDOR_ROLE();
  });

  describe("Deployment", function() {
    it("Should deploy the Regulator contract with rahatERC20 contract", async function() {   
      assert.equal(await regulator.erc20(), rahatERC20.address);
    });
  });

  describe("Roles management ", function(){
    it("should add admin role to new account via admin account", async function(){
        await regulator.addAdmin(admin,{from:deployer});
        assert.equal(await regulator.hasRole(adminRole,admin),true);
    })
    it("should add server role to new account via admin account", async function(){
        await regulator.addServer(server,{from:deployer});
        assert.equal(await regulator.hasRole(serverRole,server),true);
    })
    it("should add vendor role to new account via admin account", async function(){
        await regulator.addVendor(vendor,{from:deployer});
        assert.equal(await regulator.hasRole(vendorRole,vendor),true);
    })
    it("should add mobilizer role to new account via admin account", async function(){
        await regulator.addMobilizer(mobilizer,'project1',{from:deployer});
        assert.equal(await regulator.hasRole(mobilizerRole,mobilizer),true);
     //   const mobilizer = projectMobilizers
    })

  })

  // describe("heplers test", function(){
  //   it("should return the sum of array", async function(){
  //       const sum = await regulator.getArraySum([10,20,30]);
  //       assert.equal(60,sum);
  //   })

  //    it("should hash of given string", async function(){
  //       const hash = await regulator.findHash(phone1.toString());
  //       const expectedhash = web3.utils.soliditySha3({type: 'string', value:phone1.toString() });
  //       assert.equal(hash,expectedhash);
  //   })

  // })

  // describe("checks balances of beneficiary", function(){
  //   it("should return the ERC20 balance of beneficiary", async function(){
  //       const balance = await regulator.erc20Balance(9670);
  //       assert.equal(balance,0);
  //   })

  //   it("should return the ERC1155 balance of beneficiary", async function(){
  //       const balance = await regulator.erc1155Balance(9670,1);
  //       assert.equal(balance,0);
  //   })



  // })


  describe("Sets the Project Budget", function() {
    it("Should set the project ERC20 budget", async function() {   
        const disbursementAmount = 100 // RS.100
      const disbursementFrequency = 5 // 5 secs
      const startDate = Math.floor(Date.now() / 1000) - 3600 // current time in seconds
      const endDate = startDate + 86400 // current time + 5 secs
      const totalAmount = 10000 // RS.10000
        await adminContract.setProjectBudget_ERC20('project1',
        disbursementAmount,
        disbursementFrequency,
        startDate,
        endDate,
        totalAmount,
        {from:deployer});
        let projec1_erc20Balance = await adminContract.getProjecERC20Balance('project1');
        assert.equal(projec1_erc20Balance.toNumber(),10000)
    });

    it('should get the balance of beneficiary',async function(){
      const balance = await regulator.fetchBeneficiaryBalance('project1',phone1);
      console.log(balance.toNumber());
    })

  });

  describe('request tokens from vendor to beneficiary', function() {

    it('should create erc20 token claim from vendor to beneficiary',async function() {
      await regulator.createERC20Claim('project1',phone1,100,{from:vendor});
      const phone1Hash = web3.utils.soliditySha3({type: 'string', value: phone1.toString()});
      const claim = await regulator.recentERC20Claims(vendor,phone1Hash);
      assert.equal(claim.amount,100);
      assert.equal(claim.isReleased,false);
    })


  })

  describe('Approve requested claims by setting OTP from server account', function() {

    it('should approve erc20 token claim from server account',async function() {
      await regulator.approveERC20Claim(vendor,phone1,otpHash,100,{from:server});
      const phone1Hash = web3.utils.soliditySha3({type: 'string', value: phone1.toString()});
      const claim = await regulator.recentERC20Claims(vendor,phone1Hash);
      assert.equal(claim.amount,100);
      assert.equal(claim.isReleased,true);
      
    })

  })

  describe('Should get tokens after entering correct OTP', function() {

    it('should get erc20 tokens from claim made after entering otp set by server',async function() {
      const initialVendorErc20Balance = await rahatERC20.balanceOf(vendor);
      await regulator.getERC20FromClaim(phone1,otp,{from:vendor});
      const phone1Hash = web3.utils.soliditySha3({type: 'string', value: phone1.toString()});
      const claim = await regulator.recentERC20Claims(vendor,phone1Hash);
      const finalVendorErc20Balance = await rahatERC20.balanceOf(vendor);
      assert.equal(claim.amount,0);
      assert.equal(claim.isReleased,false);
      assert.equal(finalVendorErc20Balance.toNumber(),initialVendorErc20Balance.toNumber()+100);

    })


   })


});
