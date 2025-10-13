"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("https://mypoesis.ruputech.com/api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage("Login successful!");

      setTimeout(() => {
        if (data.user.role === "admin") router.push("/admin");
        else router.push("/config");
      }, 1000);
    } else {
      setMessage(data.message);
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen px-6"
      style={{
        backgroundColor: "#F7EEE7",
      }}
    >
      {/* Back Icon */}
      <button
        onClick={() => router.push("/")}
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
      <div className="text-center mb-10">
        <h1
          className="text-[48px] font-[400]"
          style={{ color: "#EB9385", lineHeight: "32px" }}
        >
          Sign in to your account
        </h1>
        <p
          className="text-lg mt-2"
          style={{ color: "#EB9385", lineHeight: "24px" }}
        >
          Or{" "}
          <span
            onClick={() => router.push("/register")}
            className="underline cursor-pointer hover:text-[#C04365]"
          >
            sign up
          </span>{" "}
          if you're not a member yet
        </p>
      </div>

      {/* Login Form */}
      <form
        onSubmit={handleLogin}
        className="bg-white/70 p-10 rounded-xl shadow-lg flex flex-col gap-6"
        style={{
          width: "761.68px",
          height: "430px",
          border: "1px solid #ddd",
          boxShadow: "2px 4px 12px rgba(0,0,0,0.1)",
        }}
      >
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
        <div>
          <label className="block text-sm mb-1 text-gray-700 font-medium">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded-md p-3 text-base outline-none focus:ring-1"
            style={{ borderColor: "#EB9385" }}
          />
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          className="w-full text-white py-3 rounded-full mt-2 text-lg font-semibold shadow-md hover:scale-[1.02] transition-transform"
          style={{ backgroundColor: "#C04365" }}
        >
          Sign in
        </button>

        {/* Retrieve account text */}
        <p
          className="text-center mt-2 text-sm cursor-pointer"
          style={{ color: "#555" }}
        >
          Retrieve your account
        </p>
      </form>

      {message && (
        <p className="mt-5 text-gray-700 text-base text-center">{message}</p>
      )}
    </div>
  );
}
