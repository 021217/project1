"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fadeUp = (i = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  },
});

export default function BeautifulPage() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      {/* Outer container animates in once */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="container mx-auto py-16 space-y-12"
      >
        {/* Hero */}
        <div className="text-center space-y-6">
          <motion.h1
            variants={fadeUp(0)}
            className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500"
          >
            Next.js + Tailwind + shadcn/ui
          </motion.h1>

          <motion.p
            variants={fadeUp(0.2)}
            className="max-w-2xl mx-auto text-lg text-muted-foreground"
          >
            Build modern, responsive, and beautiful apps with ease ✨
          </motion.p>

          <motion.div
            variants={fadeUp(0.3)}
            className="flex justify-center gap-4"
          >
            <Button size="lg">Get Started</Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </motion.div>
        </div>

        {/* Feature Cards (stagger) */}
        <motion.div
          className="grid md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {[
            {
              title: "Blazing Fast",
              desc: "Next.js App Router with server components for optimal performance.",
            },
            {
              title: "Beautiful UI",
              desc: "Tailwind + shadcn/ui give you modern, accessible design out of the box.",
            },
            {
              title: "Type Safe",
              desc: "End-to-end typing with TypeScript + Prisma makes dev life smoother.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              variants={
                prefersReducedMotion
                  ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
                  : fadeUp(i * 0.6)
              }
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    {f.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <motion.h2 variants={fadeUp(0)} className="text-3xl font-bold">
            Ready to build something amazing?
          </motion.h2>

          <motion.form
            variants={fadeUp(0.15)}
            className="max-w-md mx-auto flex gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <Button type="submit">Join</Button>
          </motion.form>
        </div>
      </motion.section>
    </main>
  );
}
