const SubscriptionService = artifacts.require("SubscriptionService");

contract('SubscriptionService', (accounts) => {
    let serviceProvider = accounts[0];  // The account deploying the contract
    let subscriber = accounts[1];       // The account subscribing
    let subscriptionService;

    const planId = 1;
    const monthlyFee = web3.utils.toWei('1', 'ether'); // 1 ETH fee for subscription

    beforeEach(async () => {
        subscriptionService = await SubscriptionService.new();
        // Set up the subscription plan for the service provider
        await subscriptionService.setSubscriptionPlan(planId, monthlyFee, { from: serviceProvider });
    });

    it('should set the subscription plan correctly', async () => {
        const fee = await subscriptionService.subscriptionPlans(planId);
        assert.equal(fee.toString(), monthlyFee, "The subscription plan fee was not set correctly");
    });

    it('should allow a user to subscribe', async () => {
        // Subscriber subscribes with the correct fee
        await subscriptionService.subscribe(planId, { from: subscriber, value: monthlyFee });

        const subscriberInfo = await subscriptionService.subscribers(subscriber);
        assert.equal(subscriberInfo.isActive, true, "Subscriber should be active after subscribing");
        assert.equal(subscriberInfo.planId.toString(), planId.toString(), "Subscriber should be subscribed to the correct plan");
    });

    it('should not allow incorrect subscription fee', async () => {
        const incorrectFee = web3.utils.toWei('2', 'ether'); // Incorrect fee

        try {
            // Subscriber attempts to subscribe with an incorrect fee
            await subscriptionService.subscribe(planId, { from: subscriber, value: incorrectFee });
            assert.fail("The transaction should have failed due to incorrect fee");
        } catch (error) {
            assert(error.message.includes('Incorrect subscription fee'), "Expected 'Incorrect subscription fee' error");
        }
    });

    it('should allow the subscriber to auto-renew the subscription', async () => {
        // Subscriber subscribes with the correct fee
        await subscriptionService.subscribe(planId, { from: subscriber, value: monthlyFee });

        // Subscriber auto-renews the subscription
        await subscriptionService.autoRenew({ from: subscriber, value: monthlyFee });

        const subscriberInfo = await subscriptionService.subscribers(subscriber);
        assert(subscriberInfo.subscriptionTime > 0, "Subscription time should be updated after auto-renewal");
    });

    it('should allow the subscriber to cancel the subscription', async () => {
        // Subscriber subscribes with the correct fee
        await subscriptionService.subscribe(planId, { from: subscriber, value: monthlyFee });

        // Subscriber cancels the subscription
        await subscriptionService.cancelSubscription({ from: subscriber });

        const subscriberInfo = await subscriptionService.subscribers(subscriber);
        assert.equal(subscriberInfo.isActive, false, "Subscriber should be inactive after canceling the subscription");
    });

    it('should allow the service provider to withdraw funds', async () => {
        // Get the initial balance of the service provider
        const initialBalance = web3.utils.toBN(await web3.eth.getBalance(serviceProvider));

        // Subscriber subscribes with the correct fee
        await subscriptionService.subscribe(planId, { from: subscriber, value: monthlyFee });

        // Service provider withdraws the funds
        const tx = await subscriptionService.withdraw({ from: serviceProvider });
        const receipt = await web3.eth.getTransactionReceipt(tx.tx);

        // Get the final balance of the service provider
        const finalBalance = web3.utils.toBN(await web3.eth.getBalance(serviceProvider));

        assert(finalBalance.gt(initialBalance), "The service provider should have received funds");
    });

});