App = {
    web3Provider: null,
    contracts: {}
};
  
async function init () {
    console.log("loading the current data")
    return await initWeb3();
}
  
async function initWeb3(){
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });;
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
      console.log("detected already injected web3")
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      console.log("falling back to dedicated network")
    }
  
    App.web3 = new Web3(App.web3Provider);
    return initContract();
}
  
function initContract(){
    $.getJSON('SubscriptionService.json', function(data) {
    let SubscriptionServiceArtifact = data;
    App.contracts.SubscriptionService = TruffleContract(SubscriptionServiceArtifact);
    
    // Set the provider for our contract
    App.contracts.SubscriptionService.setProvider(App.web3Provider);
    
    // Use our contract to retrieve and mark the adopted pets
    console.log("done initalising the contract")
    });
}

function setSubscriptionPlan(){
    let PlanId = document.getElementById("PlanId").value;
    let PlanFee = document.getElementById("PlanFee").value;

    if((PlanId === '') || (PlanFee === '')){
        alert("Please fill in all the fields");
        return;
    }

    App.web3.eth.getAccounts(function(error, accounts){
        if(error){
            console.log(error);
        }

        let account = accounts[0];
        console.log(account);

        App.contracts.SubscriptionService.deployed().then(function(instance) {
            SubscriptionServiceInstance = instance;

            console.log("PlanId:", PlanId, "PlanFee:", PlanFee);
            console.log("Current Account: ", account);

            return SubscriptionServiceInstance.setSubscriptionPlan(PlanId, PlanFee, {from: account});

        }).then(function(result) {
            console.log("Subscription Is Now Active:", result);
        }).catch(function(err) {
            console.error("Error checking subscription status:", err);
        });
    });
}

function subscriptionPlans() {
    let PlanId = document.getElementById("PlanIdToSee").value;

    if(PlanId === '') {
        alert("Please enter a valid Plan ID.");
        return;
    }

    PlanId = parseInt(PlanId);

    App.web3.eth.getAccounts(function(error, accounts) {
        if(error) {
            console.log(error);
            return;
        }

        let account = accounts[0];
        console.log("Current Account: ", account);

        App.contracts.SubscriptionService.deployed()
            .then(function(instance) {
                SubscriptionServiceInstance = instance;

                return SubscriptionServiceInstance.subscriptionPlans(PlanId);
            })
            .then(function(result) {
                console.log("Plan Fee for Plan ID " + PlanId + " is: " + result);

                document.getElementById("PlanFeeForId").style.display = "block";
                document.getElementById("PlanFeeForId").textContent ="The fee for requested PlanId = " + result;
            })
            .catch(function(err) {
                console.error("Error fetching subscription plan:", err);
                alert("Failed to fetch the subscription plan.");
            });
    });


}

function isSubscriptionActive(){
    App.web3.eth.getAccounts(function(error, accounts){
        if(error){
            console.log(error);
        }

        let account = accounts[0];
        console.log("Current Account: ", account);

        App.contracts.SubscriptionService.deployed().then(function(instance) {
            SubscriptionServiceInstance = instance;

            return SubscriptionServiceInstance.isSubscriptionActive({from: account});

        }).then(function(result) {
            console.log(result);
        })
    });
}

function serviceProvider(){
    App.web3.eth.getAccounts(function(error, accounts){
        if(error){
            console.log(error);
        }

        let account = accounts[0];
        console.log("Current Account: ", account);

        App.contracts.SubscriptionService.deployed().then(function(instance) {
            SubscriptionServiceInstance = instance;

            return SubscriptionServiceInstance.serviceProvider({from: account});
        }).then(function(result) {
            console.log("Service Provider: ", result);
        })
    });
}










$(function() {
    $(window).load(function() {
        init();
    });
});

