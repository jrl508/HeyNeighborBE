/**
 * Pricing & Platform Fee Calculation Helper
 * 
 * Implements the Split Fee Monetization Model:
 * - Renter Service Fee: 10% on rental subtotal + delivery fee
 * - Owner Commission: 8% on rental subtotal + delivery fee
 * - Security Deposit: 20% of daily rate (0% fee, 100% refundable hold)
 */

const calculateBookingPricing = ({
  pricePerDay,
  days,
  deliveryFee = 0,
  renterFeePercent,
  ownerFeePercent,
  depositPercent,
}) => {
  const dailyRate = parseFloat(pricePerDay) || 0;
  const numDays = parseInt(days, 10) || 1;
  const delivery = parseFloat(deliveryFee) || 0;

  const rentalSubtotal = Math.round(dailyRate * numDays * 100) / 100;
  const rentalBasis = Math.round((rentalSubtotal + delivery) * 100) / 100;

  // Percentage rates (default: 10% renter, 8% owner, 20% deposit)
  const renterRate =
    (renterFeePercent !== undefined
      ? renterFeePercent
      : parseFloat(process.env.RENTER_FEE_PERCENT) || 10) / 100;

  const ownerRate =
    (ownerFeePercent !== undefined
      ? ownerFeePercent
      : parseFloat(process.env.OWNER_COMMISSION_PERCENT) || 8) / 100;

  const depositRate =
    (depositPercent !== undefined
      ? depositPercent
      : parseFloat(process.env.DEPOSIT_PERCENT) || 20) / 100;

  const renterFee = Math.round(rentalBasis * renterRate * 100) / 100;
  const ownerCommission = Math.round(rentalBasis * ownerRate * 100) / 100;
  const platformTotalFee = Math.round((renterFee + ownerCommission) * 100) / 100;

  const totalRentalCharge = Math.round((rentalBasis + renterFee) * 100) / 100;
  const ownerPayoutAmount = Math.round((rentalBasis - ownerCommission) * 100) / 100;
  const depositAmount = Math.ceil(dailyRate * depositRate);

  const totalAmountWithDeposit = Math.round((totalRentalCharge + depositAmount) * 100) / 100;

  return {
    dailyRate,
    days: numDays,
    rentalSubtotal,
    deliveryFee: delivery,
    rentalBasis,
    renterFee,
    ownerCommission,
    platformTotalFee,
    totalRentalCharge,
    ownerPayoutAmount,
    depositAmount,
    totalAmountWithDeposit,
  };
};

module.exports = {
  calculateBookingPricing,
};
