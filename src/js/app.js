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

    if(PlanId <= 0){
        alert("PlanFee CANNOT BE <= 0");
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

            return SubscriptionServiceInstance.serviceProvider( {from: account} );
        }).then(function(SERVICEPROVIDER) {
            if(account !== SERVICEPROVIDER){
                alert("You are not the Service Provider!");
                throw new Error("ONLY SERVICE PROVIDER CAN USE THIS FUNCTION");
            }

            return SubscriptionServiceInstance.setSubscriptionPlan(PlanId, PlanFee, {from: account});
        }).then(function(result){
            console.log("Subscription Plan Set: ", result);
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

function Subscribe(){
    let PlanIdToSubscribe = document.getElementById("SubscribeInput").value;

    if(PlanIdToSubscribe === ''){
        alert("Enter Plan ID that you want to subscribe!");
        return;
    }

    App.web3.eth.getAccounts(function(error, accounts){
        if(error){
            console.log(error);
            return;
        }

        let account = accounts[0];
        console.log("Current Account: ", account);

        App.contracts.SubscriptionService.deployed().then(function(instance){
            SubscriptionServiceInstance = instance;

            return SubscriptionServiceInstance.serviceProvider( { from: account });
        }).then(function(SERVICEPROVIDER){
            if(account === SERVICEPROVIDER){
                alert("YOU ARE THE SERVICE PROVIDER!!! YOU CANNOT SUBSCRIBE!!!");
                throw new Error("Service provider cannot subscribe to plans.");
            }
            console.log("Type of PlanIdToSubscribe: ", typeof(PlanIdToSubscribe));
            console.log("PlanIdToSubscribe: ", PlanIdToSubscribe);
            return SubscriptionServiceInstance.subscriptionPlans(PlanIdToSubscribe);
        }).then(function(fee){
            console.log("Fee for subscription plan: ", fee.toString());

            if(fee <= 0){
                alert("THIS SUBSCRIPTION PLAN IS NOT SET!");
                throw new Error("THE PLAN IS NOT SET");
            }

            return SubscriptionServiceInstance.subscribe(PlanIdToSubscribe,{ from: account, value: fee });
        }).then(function(result){
            console.log("kazkas: ", result);
        }).catch(function(err){
            console.error("Error during subscription: ", err);
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

        App.contracts.SubscriptionService.deployed().then(function(instance){
            SubscriptionServiceInstance = instance;

            return SubscriptionServiceInstance.isSubscriptionActive({from: account});

        }).then(function(result) {
            console.log("Subscription status: ", result);

            document.getElementById("SubscriptionStatusText").style.display = "block";

            if(result === true){
            document.getElementById("SubscriptionStatusText").textContent ="You have an active subscription";
            } else{
            document.getElementById("SubscriptionStatusText").textContent ="You don't have an active subscription";
            }
        })
    });
}

function cancelSubscription(){
    App.web3.eth.getAccounts(function(error, accounts){
        if(error){
            console.log(error);
        }

        let account = accounts[0];
        console.log("Current Account: ", account);

        App.contracts.SubscriptionService.deployed().then(function(instance) {
            SubscriptionServiceInstance = instance;

            return SubscriptionServiceInstance.serviceProvider({ from: account });
        }).then(function(SERVICEPROVIDER){
            if(account === SERVICEPROVIDER){
                alert("YOU ARE THE SERVICE PROVIDER!!! YOU CANNOT USE THIS FUNCTION!!!");
                throw new Error("SERVICE PROVIDER CANNOT USE THIS FUNCTION");
            }

            return SubscriptionServiceInstance.isSubscriptionActive({ from: account });
        }).then(function(SubscriptionStatus){
            if(SubscriptionStatus === false){
                alert("YOU DON'T HAVE ACTIVE SUBSCRIPTION PLAN!");
                throw new Error("ONLY ACTIVE SUBSCRIBERS CAN USE THIS FUNCTION");
            }

            return SubscriptionServiceInstance.cancelSubscription({ from: account }); 
        }).then(function(result){
            console.log("Subscription canceled: ", result);
        })
    });
}

// function autoRenew(){
    
//     App.web3.eth.getAccounts(function(error, accounts){
//         if(error){
//             console.log(error);
//             return;
//         }

//         let account = accounts[0];
//         console.log("Current Account: ", account);

//         App.contracts.SubscriptionService.deployed().then(function(instance){
//             SubscriptionServiceInstance = instance;

//             return SubscriptionServiceInstance.serviceProvider({ from: account });
//         }).then(function(SERVICEPROVIDER){
//             if(account === SERVICEPROVIDER){
//                 alert("YOU ARE THE SERVICE PROVIDER!!! YOU CAN'T USE THIS FUNCTION");
//                 throw new Error("SERVICE PROVIDER CAN'T USE THIS FUNCTION");
//             }

//             return SubscriptionServiceInstance.isSubscriptionActive({ from: account });
//         }).then(function(SubscriptionStatus){
//             if(SubscriptionStatus === false){
//                 alert("YOU DON'T HAVE ACTIVE SUBSCRIPTIONS!");
//                 throw new Error("ONLY ACTIVE SUBSCRIBERS CAN USE THIS FUNCTION");
//             }

//             return SubscriptionServiceInstance.MyCurrentPlanID({ from: account });
//         }).then(function(SubPlanID){
//             console.log("TYPE OF SubPlanID: ", typeof(SubPlanID));
//             console.log("Subscribers Plan ID: ", SubPlanID);
//             return SubscriptionServiceInstance.subscriptionPlans(SubPlanID);
//         }).then(function(fee){
//             console.log("Subscription Fee for Plan: ", fee.toNumber());

//             return SubscriptionServiceInstance.autoRenew({ from: account, value: fee.toNumber() });

//         }).then(function(result){
//             console.log("Successfully subscribed to plan: ", result); 
//         }).catch(function(err){
//             console.log("Error during Renewing proccess: ", err);
//         });
//     });
// }

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

            document.getElementById("ServiceProviderText").style.display = "block";
            document.getElementById("ServiceProviderText").textContent ="Service Provider account: " + result;
        })
    });
}

function withdraw(){
    App.web3.eth.getAccounts(function(error, accounts){
        if(error){
            console.log(error);
            return;
        }

        let account = accounts[0];
        console.log("Current Account: ", account);

        App.contracts.SubscriptionService.deployed().then(function(instance){
            SubscriptionServiceInstance = instance;

            return SubscriptionServiceInstance.serviceProvider({ from: account });
        }).then(function(SERVICEPROVIDER){
            console.log("Service Provider: ", SERVICEPROVIDER);

            if(account !== SERVICEPROVIDER){
                alert("You are not the Service Provider!");
                throw new Error("ONLY SERVICE PROVIDER CAN WITHDRAW");
            }

            return SubscriptionServiceInstance.withdraw({ from: account });
        }).then(function(result){
            console.log("Withdrawn: ", result);
        }).catch(function(err){
            console.error("Error during subscription: ", err);
        });
    });
}



$(function() {
    $(window).load(function() {
        init();
    });
});

