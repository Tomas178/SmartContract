// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SubscriptionService {

    struct Subscriber {
        uint256 balance;
        uint256 subscriptionTime;
        uint256 planId;
        bool isActive;
    }

    address public serviceProvider;
    mapping(uint256 => uint256) public subscriptionPlans;
    mapping(address => Subscriber) public subscribers;

    event SubscriptionStarted(address indexed subscriber, uint256 PlanId);
    event SubscriptionRenewed(address indexed subscriber, uint256 planId);
    event SubscriptionCanceled(address indexed subscriber);
    event SubscriptionPlanSet(uint256 PlanId, uint256 MonthlyFee);
    event Withdraw(uint256 balance);

    modifier onlyServiceProvider() {
        require(msg.sender == serviceProvider, "Not authorized");
        _;
    }

    modifier onlyActiveSubscriber() {
        require(subscribers[msg.sender].isActive, "Subscription is not active");
        _;
    }

    constructor() {
        serviceProvider = msg.sender;
    }

    function setSubscriptionPlan(uint256 planId, uint256 monthlyFee) external onlyServiceProvider {
        subscriptionPlans[planId] = monthlyFee;
        emit SubscriptionPlanSet(planId, monthlyFee);
    }

    function subscribe(uint256 planId) external payable {
        uint256 fee = subscriptionPlans[planId];
        require(fee > 0, "Invalid subscription plan");
        require(msg.value == fee, "Incorrect subscription fee");

        subscribers[msg.sender].balance += msg.value;
        subscribers[msg.sender].subscriptionTime = block.timestamp;
        subscribers[msg.sender].planId = planId;
        subscribers[msg.sender].isActive = true;

        emit SubscriptionStarted(msg.sender, planId);
    }

    function isSubscriptionActive() public view returns (bool) {
        Subscriber memory sub = subscribers[msg.sender];
        if (!sub.isActive) return false;
        uint256 elapsedTime = block.timestamp - sub.subscriptionTime;
        uint256 requiredTime = 30 days;
        return elapsedTime <= requiredTime;
    }

    function autoRenew() external onlyActiveSubscriber payable {
        uint256 planId = subscribers[msg.sender].planId;
        uint256 fee = subscriptionPlans[planId];
        require(fee > 0, "Subscription plan not set");
        require(msg.value == fee, "Incorrect subscription fee");

        require(isSubscriptionActive(), "Subscription expired");
        
        subscribers[msg.sender].subscriptionTime = block.timestamp;

        emit SubscriptionRenewed(msg.sender, planId);
    }

    function cancelSubscription() external onlyActiveSubscriber {
        subscribers[msg.sender].isActive = false;
        emit SubscriptionCanceled(msg.sender);
    }

    function withdraw() external onlyServiceProvider {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds available");
        emit Withdraw(balance);
        payable(serviceProvider).transfer(balance);
    }

    receive() external payable {}
}
