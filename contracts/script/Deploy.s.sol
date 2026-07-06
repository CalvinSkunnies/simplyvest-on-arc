// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {SimplyVest} from "../src/SimplyVest.sol";

contract DeploySimplyVest is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        SimplyVest vest = new SimplyVest();
        console.log("SimplyVest deployed at:", address(vest));

        vm.stopBroadcast();
    }
}

contract DeploySimplyVestSafe is Script {
    function run() external {
        vm.startBroadcast();

        SimplyVest vest = new SimplyVest();
        console.log("SimplyVest deployed at:", address(vest));

        vm.stopBroadcast();
    }
}
