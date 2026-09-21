-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "lastPaystackReference" TEXT,
ADD COLUMN     "paystackCustomerCode" TEXT,
ADD COLUMN     "paystackEmailToken" TEXT,
ADD COLUMN     "paystackPlanCode" TEXT,
ADD COLUMN     "paystackSubscriptionCode" TEXT;
