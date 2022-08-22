const RahatAdmin = artifacts.require("Admin");
const Rahat = artifacts.require("Regulator");
const RahatERC20 = artifacts.require("RahatERC20");

describe("Admin contract", function() {
  let rahatERC20;
  let rahat;
  let admin;
  let serverRole;
  let adminRole;
  let vendorRole;
  let mobilizerRole;
  let managerRole;

  before(async function() {
    [deployer,admin,server,vendor,manager,mobilizer,addr1,addr2] = await web3.eth.getAccounts();
    rahatERC20 = await RahatERC20.new("Rahat","RHT",deployer);
    rahat = await Rahat.new(rahatERC20.address,deployer)
    admin = await RahatAdmin.new(rahatERC20.address,rahat.address,10000000,deployer)
    serverRole = await rahat.SERVER_ROLE();
    adminRole = await rahat.DEFAULT_ADMIN_ROLE();
    serverRole = await rahat.SERVER_ROLE();
    managerRole = await rahat.MANAGER_ROLE();
    mobilizerRole = await rahat.MOBILIZER_ROLE();
    vendorRole = await rahat.VENDOR_ROLE();

  });




  describe("Deployment", function() {
    it("Should deploy the RahatAdmin with rahatERC20 and rahat contract", async function() {   
      assert.equal(await admin.erc20(), rahatERC20.address);
      assert.equal(await admin.regulatorContract(), rahat.address);
      assert.equal(await admin.owner(deployer), true);
    });
  });

  describe('ownership management', function() {
    it('should add owner',async function() {
      await admin.addOwner(addr1);
      const isOwner = await admin.owner(addr1);
      assert.equal(isOwner,true)
    })
  })


  describe("Sets the Project Budget", function() {
    it("Should set the project ERC20 budget", async function() {   
      const disbursementAmount = 100 // RS.100
      const disbursementFrequency = 5 // 5 secs
      const startDate = Math.floor(Date.now() / 1000) // current time in seconds
      const endDate = startDate + 86400 // current time + 5 secs
      const totalAmount = 10000 // RS.10000
        await admin.setProjectBudget_ERC20('project1',
        disbursementAmount,
        disbursementFrequency,
        startDate,
        endDate,
        totalAmount,
        {from:deployer});
        let projec1_erc20Balance = await admin.getProjecERC20Balance('project1');
        assert.equal(projec1_erc20Balance.toNumber(),10000)
    });


  });

});