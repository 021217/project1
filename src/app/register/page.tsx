"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      setMessage("Passwords do not match");
      return;
    }

    const res = await fetch("https://mypoesis.ruputech.com/api/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setMessage(data.message);

    if (data.success) {
      setTimeout(() => (window.location.href = "/login"), 1200);
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen px-6"
      style={{ backgroundColor: "#F7EEE7" }}
    >
      {/* Back Icon (top-left) */}
      <button
        onClick={() => router.push("/login")}
        className="absolute top-32 left-32 hover:scale-[1.05] transition-transform"
      >
        <Image
          src="/icons/back.png"
          alt="Back"
          width={50}
          height={50}
          className="opacity-80 hover:opacity-100"
        />
      </button>

      {/* Header */}
      <h1 className="text-center mb-10">
        <span
          className="text-[48px] font-[400]"
          style={{ color: "#EB9385", lineHeight: "32px", fontFamily: "Poppins, sans-serif" }}
        >
          Create{" "}
        </span>
        <span
          className="text-[36px] font-[400]"
          style={{ color: "#EB9385", lineHeight: "32px", fontFamily: "Poppins, sans-serif"  }}
        >
          a new account
        </span>
      </h1>

      {/* Form Card */}
      <form
        onSubmit={handleRegister}
        className="bg-white/70 p-10 rounded-xl shadow-lg flex flex-col gap-6"
        style={{
          width: "761.68px",
          height: "586.88px",
          border: "1px solid #ddd",
          boxShadow: "2px 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        {/* User name */}
        <div>
          <label className="block text-sm mb-1 text-gray-700 font-medium">
            User name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border rounded-md p-3 text-base outline-none focus:ring-1"
            style={{ borderColor: "#EB9385" }}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm mb-1 text-gray-700 font-medium">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-md p-3 text-base outline-none focus:ring-1"
            style={{ borderColor: "#EB9385" }}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <label className="block text-sm mb-1 text-gray-700 font-medium">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded-md p-3 pr-10 text-base outline-none focus:ring-1"
            style={{ borderColor: "#EB9385" }}
          />
          <button
            type="button"
            className="absolute right-3 top-[40px] text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            <Image
              src={showPassword ? "/icons/hide.svg" : "/icons/unhide.svg"}
              alt="toggle password visibility"
              width={22}
              height={22}
            />
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <label className="block text-sm mb-1 text-gray-700 font-medium">
            Confirm your password
          </label>
          <input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full border rounded-md p-3 pr-10 text-base outline-none focus:ring-1"
            style={{ borderColor: "#EB9385" }}
          />
          <button
            type="button"
            className="absolute right-3 top-[40px] text-gray-600"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            <Image
              src={showConfirm ? "/icons/hide.svg" : "/icons/unhide.svg"}
              alt="toggle confirm password visibility"
              width={22}
              height={22}
            />
          </button>
        </div>

        {/* Newsletter Checkbox */}
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" /> Receive a weekly digest of new sites, plus
          other occasional news
        </label>

        {/* Submit */}
        <button
          type="submit"
          className="w-full text-white py-3 rounded-full mt-2 text-lg font-semibold shadow-md hover:scale-[1.02] transition-transform"
          style={{ backgroundColor: "#C04365" }}
        >
          Sign up
        </button>
      </form>

      {message && (
        <p className="mt-5 text-gray-700 text-base text-center">{message}</p>
      )}
    </div>
  );
}
