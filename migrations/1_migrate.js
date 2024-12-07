const SubscriptionService = artifacts.require("SubscriptionService");

module.exports = function(_deployer){
    _deployer.deploy(SubscriptionService);
};