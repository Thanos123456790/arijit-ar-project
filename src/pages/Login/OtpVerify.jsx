import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../../hooks/useAlert";

const API = `${import.meta.env.VITE_API_URL}`;

export default function OtpVerify() {
    const navigate = useNavigate();
    const { show, AlertPortal } = useAlert();
    const [otp, setOtp] = useState("");

    const handleVerify = async () => {
        if (!otp.match(/^\d{4}$/)) {
            show({ message: "Enter a 4-digit OTP.", type: "warning" });
            return;
        }

        const user = JSON.parse(sessionStorage.getItem("_pending_user"));
        if (!user) {
            show({ message: "Registration session expired.", type: "error" });
            navigate("/");
            return;
        }

        try {
            const res = await fetch(`${API}/auth/register/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...user, otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                show({ message: data.message || "OTP verification failed.", type: "error" });
                return;
            }

            show({ message: "Registration successful! Please login.", type: "success" });
            sessionStorage.removeItem("_pending_user");
            navigate("/", { replace: true });
        } catch (err) {
            console.error(err);
            show({ message: "Error during verification.", type: "error" });
        }
    };

    return (
        <div className="login-container">
            <div className="form-box">
                <h3>OTP Verification</h3>
                <p>Please enter the 4-digit OTP sent to your email.</p>
                <input
                    type="text"
                    maxLength="4"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1234"
                />
                <button onClick={handleVerify}>Verify OTP</button>
            </div>
            <AlertPortal />
        </div>
    );
}
