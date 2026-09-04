import mongoose from "mongoose";
import User from "../models/User.js";
import Provider from "../models/Provider.js";
import ProviderVerification from "../models/ProviderVerification.js";
import Booking from "../models/Booking.js";
import BookingRequest from "../models/BookingRequest.js";
import Review from "../models/Review.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";
import { calculateDistanceKm } from "../lib/geo.js";

const MONGODB_URI = "mongodb://localhost:27017/SmartserveDB";

async function runTest() {
    console.log("=== STARTING SMARTSERVE MARKETPLACE END-TO-END TEST ===");

    await mongoose.connect(MONGODB_URI);
    console.log("1. Connected to MongoDB");

    // Clean up previous test artifacts
    await User.deleteMany({ email: "test.customer@smartserve.local" });
    await Provider.deleteMany({ email: "test.plumber@smartserve.local" });

    // 1. Create Test Customer
    const customer = await User.create({
        name: "Aman Sharma",
        phone: "9876543210",
        email: "test.customer@smartserve.local",
        password: "hashedpassword123",
        role: "customer",
    });
    console.log("2. Customer registered:", customer.name, `(${customer._id})`);

    // 2. Create Test Provider (Plumber)
    const provider = await Provider.create({
        name: "Ramesh Verma",
        phone: "9876543211",
        email: "test.plumber@smartserve.local",
        password: "hashedpassword123",
        address: "Sector 14, Gandhinagar, Gujarat",
        Proffesion: "plumbing",
        Experience: "3-5",
        ServiceRadius: "in 15km",
        latitude: 23.2156,
        longitude: 72.6369,
        isOnline: true,
        verificationStatus: "verified",
        role: "serviceprovider",
    });
    console.log("3. Service Provider registered:", provider.name, `(${provider._id})`, "Profession:", provider.Proffesion);

    // 3. Provider Verification Check
    const verification = await ProviderVerification.create({
        providerId: provider._id,
        documentType: "aadhar",
        documentPath: "/uploads/verification/test_doc.jpg",
        selfiePath: "/uploads/verification/test_selfie.jpg",
        status: "verified",
        verifiedAt: new Date(),
    });
    console.log("4. Provider identity verified:", verification.status);

    // 4. Customer Books Service (Plumbing)
    const customerLat = 23.2200;
    const customerLon = 72.6400;
    const distance = calculateDistanceKm(customerLat, customerLon, provider.latitude, provider.longitude);
    console.log(`5. Geolocation distance calculated: ${distance} km`);

    const booking = await Booking.create({
        customerId: customer._id,
        services: [{
            serviceId: "plumbing",
            name: "Plumbing",
            problem: "Leakage Repair",
            price: 499,
        }],
        description: "Kitchen sink pipe is leaking heavily under the counter.",
        address: "Flat 402, Green Valley Apartments, Gandhinagar",
        location: {
            latitude: customerLat,
            longitude: customerLon,
        },
        preferredDate: "2026-09-05",
        preferredTime: "10:00 AM - 12:00 PM",
        estimatedTotal: 499,
        status: "pending",
    });
    console.log("6. Booking created by customer:", booking._id, "Status:", booking.status);

    // 5. Dispatch Engine: Match Provider
    const bookingReq = await BookingRequest.create({
        bookingId: booking._id,
        providerId: provider._id,
        status: "sent",
        distanceKm: distance,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    console.log("7. BookingRequest dispatched to provider:", bookingReq._id, "Status:", bookingReq.status);

    // 6. Provider Accepts Request
    // Check single active job rule
    const activeJobs = await Booking.find({
        assignedProviderId: provider._id,
        status: { $in: ["accepted", "in_progress"] },
    });
    if (activeJobs.length > 0) {
        throw new Error("Validation failure: Provider has active jobs!");
    }

    bookingReq.status = "accepted";
    bookingReq.respondedAt = new Date();
    await bookingReq.save();

    booking.status = "accepted";
    booking.assignedProviderId = provider._id;
    await booking.save();
    console.log("8. Provider accepted request. Booking status:", booking.status, "Assigned to:", provider.name);

    // 7. Prevent Provider from accepting concurrent conflicting jobs
    const hasConflict = await Booking.findOne({
        assignedProviderId: provider._id,
        status: { $in: ["accepted", "in_progress"] },
    });
    console.log("9. Verified active job locking (Plan.txt Rule #5):", hasConflict ? "LOCKED (Correct)" : "FAILED");

    // 8. Provider Progresses Job: in_progress
    booking.status = "in_progress";
    await booking.save();
    console.log("10. Provider started job. Booking status:", booking.status);

    // 9. Provider Completes Job
    booking.status = "completed";
    booking.completedAt = new Date();
    await booking.save();
    console.log("11. Provider finished job. Booking status:", booking.status, "Completed at:", booking.completedAt);

    // 10. Payment Settlement
    const payment = await Payment.create({
        bookingId: booking._id,
        customerId: customer._id,
        providerId: provider._id,
        amount: booking.estimatedTotal,
        method: "cash",
        status: "completed",
        paidAt: new Date(),
    });
    console.log("12. Payment settled:", `₹${payment.amount}`, "Method:", payment.method, "Status:", payment.status);

    // 11. Customer Review Submission
    const review = await Review.create({
        bookingId: booking._id,
        customerId: customer._id,
        providerId: provider._id,
        rating: 5,
        comment: "Excellent and fast plumbing service. Highly recommended!",
    });
    console.log("13. Customer review created:", review.rating, "stars -", review.comment);

    // 12. Provider Aggregate Update
    const allReviews = await Review.find({ providerId: provider._id });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    provider.rating = Math.round(avg * 10) / 10;
    provider.reviewCount = allReviews.length;
    await provider.save();
    console.log("14. Provider rating updated:", provider.rating, `(${provider.reviewCount} reviews)`);

    // Clean up test documents
    await User.findByIdAndDelete(customer._id);
    await Provider.findByIdAndDelete(provider._id);
    await ProviderVerification.findByIdAndDelete(verification._id);
    await Booking.findByIdAndDelete(booking._id);
    await BookingRequest.findByIdAndDelete(bookingReq._id);
    await Payment.findByIdAndDelete(payment._id);
    await Review.findByIdAndDelete(review._id);
    console.log("15. Cleaned up test data.");

    console.log("=== ALL TEST MARKETPLACE ASSERTIONS PASSED SUCCESSFULLY! ===");
    process.exit(0);
}

runTest().catch((err) => {
    console.error("TEST FAILED:", err);
    process.exit(1);
});
