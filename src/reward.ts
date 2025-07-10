
const rewardAmount = rawBigIntAmount
const feeAmount = (rewardAmount * BigInt(10)) / BigInt(100); // 10% fee
const rewardAmountWithFee = rewardAmount + feeAmount;
