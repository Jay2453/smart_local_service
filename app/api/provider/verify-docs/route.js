import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import path from "path";
import fs from "fs/promises";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Provider from "@/models/Provider";
import ProviderVerification from "@/models/ProviderVerification";

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("smartserve_session")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Authentication required" },
                { status: 401 }
            );
        }

        const session = await verifySession(token);
        if (!session || session.role !== "serviceprovider") {
            return NextResponse.json(
                { success: false, message: "Only service providers can submit verification" },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const documentType = formData.get("documentType");
        const documentFile = formData.get("document");
        const selfieFile = formData.get("selfie");

        if (!documentType || !documentFile || !selfieFile) {
            return NextResponse.json(
                { success: false, message: "Document type, document file, and selfie are required" },
                { status: 400 }
            );
        }

        const uploadDir = path.join(process.cwd(), "public", "uploads", "verification");
        await fs.mkdir(uploadDir, { recursive: true });

        // Save Document File
        const docExt = path.extname(documentFile.name || "document.jpg") || ".jpg";
        const docFileName = `${session.id}_doc_${Date.now()}${docExt}`;
        const docFilePath = path.join(uploadDir, docFileName);
        const docBuffer = Buffer.from(await documentFile.arrayBuffer());
        await fs.writeFile(docFilePath, docBuffer);

        // Save Selfie File
        const selfieFileName = `${session.id}_selfie_${Date.now()}.jpg`;
        const selfieFilePath = path.join(uploadDir, selfieFileName);
        const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());
        await fs.writeFile(selfieFilePath, selfieBuffer);

        await connectDB();

        // In development mode or initial launch, auto-verify so flow is immediately testable
        const isAutoVerify = process.env.NODE_ENV !== "production" || process.env.AUTO_VERIFY === "true";
        const status = isAutoVerify ? "verified" : "pending";
        const verifiedAt = isAutoVerify ? new Date() : null;

        const verificationRecord = await ProviderVerification.findOneAndUpdate(
            { providerId: session.id },
            {
                providerId: session.id,
                documentType,
                documentPath: `/uploads/verification/${docFileName}`,
                selfiePath: `/uploads/verification/${selfieFileName}`,
                status,
                rejectionReason: "",
                verifiedAt,
            },
            { upsert: true, new: true }
        );

        await Provider.findByIdAndUpdate(session.id, {
            verificationStatus: status,
        });

        return NextResponse.json({
            success: true,
            message: status === "verified" 
                ? "Identity verified successfully!" 
                : "Verification submitted for review",
            status,
            verification: verificationRecord,
        });

    } catch (error) {
        console.error("Provider verification submission error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to submit verification documents" },
            { status: 500 }
        );
    }
}
